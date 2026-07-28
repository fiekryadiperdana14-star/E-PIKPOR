const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware: verify JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
}

// Admin/Kanit only
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
        if (!['admin', 'kanit', 'kasubnit'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
}

// GET /api/schedules — Get all schedules (filter by month/year)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { bulan, tahun, subnit_id } = req.query;
        let query = `
            SELECT ds.*, u.nama_lengkap, u.pangkat, u.role,
                   s.nama as subnit_nama, s.kode as subnit_kode,
                   r.nama as regu_nama
            FROM duty_schedules ds
            JOIN users u ON ds.user_id = u.id
            JOIN subnit s ON ds.subnit_id = s.id
            LEFT JOIN regu r ON ds.regu_id = r.id
        `;
        const params = [];
        const conditions = [];

        if (bulan && tahun) {
            conditions.push('EXTRACT(MONTH FROM ds.tanggal) = ? AND EXTRACT(YEAR FROM ds.tanggal) = ?');
            params.push(parseInt(bulan), parseInt(tahun));
        }
        if (subnit_id) {
            conditions.push('ds.subnit_id = ?');
            params.push(parseInt(subnit_id));
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ` ORDER BY ds.tanggal ASC, 
            CASE ds.shift 
                WHEN 'Pagi' THEN 1 
                WHEN 'Sore' THEN 2 
                WHEN 'Malam' THEN 3 
                ELSE 4 
            END`;

        const [schedules] = await db.query(query, params);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/schedules/today — Get today's schedule
router.get('/today', verifyToken, async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT ds.*, u.nama_lengkap, u.pangkat, u.role,
                   s.nama as subnit_nama, s.kode as subnit_kode, s.warna,
                   r.nama as regu_nama
            FROM duty_schedules ds
            JOIN users u ON ds.user_id = u.id
            JOIN subnit s ON ds.subnit_id = s.id
            LEFT JOIN regu r ON ds.regu_id = r.id
            WHERE ds.tanggal = CURRENT_DATE
            ORDER BY s.id, 
                CASE ds.shift 
                    WHEN 'Pagi' THEN 1 
                    WHEN 'Sore' THEN 2 
                    WHEN 'Malam' THEN 3 
                    ELSE 4 
                END, 
                u.nama_lengkap
        `);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/schedules — Create a single schedule entry
router.post('/', adminAuth, async (req, res) => {
    try {
        const { tanggal, shift, user_id, subnit_id, regu_id, tipe, catatan } = req.body;

        // Check for duplicate
        const [existing] = await db.query(
            'SELECT id FROM duty_schedules WHERE tanggal = ? AND shift = ? AND user_id = ?',
            [tanggal, shift, user_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Jadwal sudah ada untuk personel ini pada tanggal dan shift tersebut.' });
        }

        const [result] = await db.query(
            `INSERT INTO duty_schedules (tanggal, shift, user_id, subnit_id, regu_id, tipe, catatan, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [tanggal, shift, user_id, subnit_id, regu_id || null, tipe || 'reguler', catatan || null, req.user.id]
        );

        res.status(201).json({ message: 'Jadwal piket berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/schedules/generate — Auto-generate schedule for a date range
router.post('/generate', adminAuth, async (req, res) => {
    try {
        const { tanggal_mulai, tanggal_selesai } = req.body;

        // Get all active personnel with subnit_id or leaders
        const [personel] = await db.query(`
            SELECT u.id, u.nama_lengkap, u.pangkat, u.role, u.subnit_id, u.regu_id 
            FROM users u 
            WHERE u.is_active = TRUE AND (u.subnit_id IS NOT NULL OR u.role IN ('kanit', 'kasubnit'))
            ORDER BY u.subnit_id, u.regu_id, u.id
        `);

        // Get subnits
        const [subnits] = await db.query('SELECT * FROM subnit ORDER BY id');

        // Get holidays in range
        const [holidays] = await db.query(
            'SELECT tanggal FROM holidays WHERE tanggal BETWEEN ? AND ?',
            [tanggal_mulai, tanggal_selesai]
        );
        const holidaySet = new Set(holidays.map(h => {
            const d = new Date(h.tanggal);
            return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        }));

        const shifts = ['Pagi', 'Sore', 'Malam'];
        let inserted = 0;

        // Group members by subnit
        // - Subnit Tengah led by Kanit Gakkum
        // - Subnit Timur & Barat led by Kasubnit
        const bySubnit = {};
        subnits.forEach(s => { bySubnit[s.id] = []; });

        const kasubnits = personel.filter(p => p.role === 'kasubnit');
        let kasubnitIdx = 0;

        personel.forEach(p => {
            if (p.subnit_id && bySubnit[p.subnit_id]) {
                bySubnit[p.subnit_id].push(p);
            } else if (p.role === 'kanit' || (p.nama_lengkap && p.nama_lengkap.toLowerCase().includes('fiekry'))) {
                // Kanit Gakkum leads Subnit Tengah (subnit id 2)
                const tengah = subnits.find(s => s.nama.toLowerCase().includes('tengah')) || subnits[1] || subnits[0];
                if (tengah && bySubnit[tengah.id]) {
                    p.subnit_id = tengah.id;
                    bySubnit[tengah.id].unshift(p);
                }
            } else if (p.role === 'kasubnit' || (p.nama_lengkap && (p.nama_lengkap.toLowerCase().includes('sucipto') || p.nama_lengkap.toLowerCase().includes('sari')))) {
                if (p.nama_lengkap.toLowerCase().includes('sucipto') || p.nama_lengkap.toLowerCase().includes('wardani')) {
                    // Kasubnit 1 -> Subnit Timur (id 1)
                    const timur = subnits.find(s => s.nama.toLowerCase().includes('timur')) || subnits[0];
                    if (timur && bySubnit[timur.id]) { p.subnit_id = timur.id; bySubnit[timur.id].unshift(p); }
                } else {
                    // Kasubnit 2 -> Subnit Barat (id 3)
                    const barat = subnits.find(s => s.nama.toLowerCase().includes('barat')) || subnits[2] || subnits[0];
                    if (barat && bySubnit[barat.id]) { p.subnit_id = barat.id; bySubnit[barat.id].unshift(p); }
                }
            }
        });

        // Generate schedule for each date
        let currentDate = new Date(tanggal_mulai);
        const endDate = new Date(tanggal_selesai);
        let dayCounter = 0;

        while (currentDate <= endDate) {
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidaySet.has(dateStr);
            const tipe = (isWeekend || isHoliday) ? (isHoliday ? 'libur_nasional' : 'wiken') : 'reguler';

            for (const subnit of subnits) {
                const members = bySubnit[subnit.id] || [];
                if (members.length === 0) continue;

                // For each shift (Pagi, Sore, Malam), assign 2 members
                for (let shiftIdx = 0; shiftIdx < shifts.length; shiftIdx++) {
                    const shiftName = shifts[shiftIdx];
                    const offset = (dayCounter * 3 + shiftIdx) * 2;

                    for (let count = 0; count < 2; count++) {
                        const memberIdx = (offset + count) % members.length;
                        const member = members[memberIdx];

                        // Avoid duplicate entry for same date, shift, user
                        const [existing] = await db.query(
                            'SELECT id FROM duty_schedules WHERE tanggal = ? AND shift = ? AND user_id = ?',
                            [dateStr, shiftName, member.id]
                        );
                        if (existing.length === 0) {
                            await db.query(
                                `INSERT INTO duty_schedules (tanggal, shift, user_id, subnit_id, regu_id, tipe, created_by) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [dateStr, shiftName, member.id, subnit.id, member.regu_id || null, tipe, req.user.id]
                            );
                            inserted++;
                        }
                    }
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
        }

        res.status(201).json({ message: `Jadwal berhasil di-generate: ${inserted} entri baru. (2 orang per shift per Subnit)`, count: inserted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/schedules/:id — Update schedule (full edit)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { shift, tanggal, user_id, subnit_id, status, catatan } = req.body;
        const fields = [];
        const values = [];
        if (shift !== undefined) { fields.push('shift = ?'); values.push(shift); }
        if (tanggal !== undefined) { fields.push('tanggal = ?'); values.push(tanggal); }
        if (user_id !== undefined) { fields.push('user_id = ?'); values.push(user_id); }
        if (subnit_id !== undefined) { fields.push('subnit_id = ?'); values.push(subnit_id); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (catatan !== undefined) { fields.push('catatan = ?'); values.push(catatan); }
        if (fields.length === 0) return res.status(400).json({ message: 'Tidak ada data yang diupdate.' });
        values.push(req.params.id);
        await db.query('UPDATE duty_schedules SET ' + fields.join(', ') + ' WHERE id = ?', values);
        res.json({ message: 'Jadwal berhasil diupdate.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/schedules/:id — Delete schedule
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM duty_schedules WHERE id = ?', [req.params.id]);
        res.json({ message: 'Jadwal berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/schedules/range — Delete schedule by date range
router.delete('/range/:start/:end', adminAuth, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM duty_schedules WHERE tanggal BETWEEN ? AND ?',
            [req.params.start, req.params.end]
        );
        res.json({ message: `${result.affectedRows} jadwal berhasil dihapus.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
