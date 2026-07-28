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

        // Get all active personnel
        const [personel] = await db.query(`
            SELECT u.id, u.nama_lengkap, u.pangkat, u.role, 
                   COALESCE(u.subnit_id, r.subnit_id) AS subnit_id, 
                   u.regu_id, r.nama AS regu_nama, s.nama AS subnit_nama
            FROM users u 
            LEFT JOIN regu r ON u.regu_id = r.id
            LEFT JOIN subnit s ON COALESCE(u.subnit_id, r.subnit_id) = s.id
            WHERE u.is_active = TRUE
            ORDER BY subnit_id, u.regu_id, u.id
        `);

        // Get subnits
        const [subnits] = await db.query('SELECT * FROM subnit ORDER BY id');

        // Get regus
        const [regus] = await db.query('SELECT * FROM regu ORDER BY subnit_id, id');

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

        // Separate leaders from regular members
        const leaders = []; // kanit, kasubnit
        const regularMembers = []; // regular regu members

        personel.forEach(p => {
            const isKanit = p.role === 'kanit' || (p.nama_lengkap && p.nama_lengkap.toLowerCase().includes('fiekry'));
            const isKasubnit = p.role === 'kasubnit' || 
                (p.nama_lengkap && (p.nama_lengkap.toLowerCase().includes('sucipto') || p.nama_lengkap.toLowerCase().includes('sari')));

            if (isKanit || isKasubnit) {
                // Determine leader's subnit
                let leaderSubnitId = p.subnit_id;
                if (isKanit) {
                    const tengah = subnits.find(s => s.nama.toLowerCase().includes('tengah'));
                    leaderSubnitId = tengah ? tengah.id : (subnits[1] || subnits[0]).id;
                } else if (p.nama_lengkap && (p.nama_lengkap.toLowerCase().includes('sucipto') || p.nama_lengkap.toLowerCase().includes('wardani'))) {
                    const timur = subnits.find(s => s.nama.toLowerCase().includes('timur'));
                    leaderSubnitId = timur ? timur.id : (subnits[0]).id;
                } else {
                    const barat = subnits.find(s => s.nama.toLowerCase().includes('barat'));
                    leaderSubnitId = barat ? barat.id : (subnits[2] || subnits[0]).id;
                }
                leaders.push({ ...p, subnit_id: leaderSubnitId, isKanit, isKasubnit: !isKanit });
            } else {
                regularMembers.push(p);
            }
        });

        // Group regular members by regu
        const byRegu = {};
        regus.forEach(r => { byRegu[r.id] = { regu: r, members: [] }; });

        regularMembers.forEach(p => {
            if (p.regu_id && byRegu[p.regu_id]) {
                byRegu[p.regu_id].members.push(p);
            }
        });

        // Group regus by subnit
        const regusBySubnit = {};
        subnits.forEach(s => { regusBySubnit[s.id] = []; });
        regus.forEach(r => {
            if (r.subnit_id && regusBySubnit[r.subnit_id]) {
                regusBySubnit[r.subnit_id].push(r);
            }
        });

        // Group leaders by subnit
        const leadersBySubnit = {};
        subnits.forEach(s => { leadersBySubnit[s.id] = []; });
        leaders.forEach(l => {
            if (l.subnit_id && leadersBySubnit[l.subnit_id]) {
                leadersBySubnit[l.subnit_id].push(l);
            }
        });

        // Generate schedule for each date
        let currentDate = new Date(tanggal_mulai + 'T00:00:00');
        const endDate = new Date(tanggal_selesai + 'T23:59:59');
        let dayCounter = 0;

        // Track regu member rotation indices
        const reguRotation = {};
        regus.forEach(r => { reguRotation[r.id] = 0; });

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
                const subnitRegus = regusBySubnit[subnit.id] || [];
                const subnitLeaders = leadersBySubnit[subnit.id] || [];

                for (let shiftIdx = 0; shiftIdx < shifts.length; shiftIdx++) {
                    const shiftName = shifts[shiftIdx];

                    // 1. Assign leader (Kanit/Kasubnit) for this subnit+shift
                    if (subnitLeaders.length > 0) {
                        const leaderIdx = (dayCounter * shifts.length + shiftIdx) % subnitLeaders.length;
                        const leader = subnitLeaders[leaderIdx];

                        const [existing] = await db.query(
                            'SELECT id FROM duty_schedules WHERE tanggal = ? AND shift = ? AND user_id = ?',
                            [dateStr, shiftName, leader.id]
                        );
                        if (existing.length === 0) {
                            await db.query(
                                `INSERT INTO duty_schedules (tanggal, shift, user_id, subnit_id, regu_id, tipe, created_by) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [dateStr, shiftName, leader.id, subnit.id, leader.regu_id || null, tipe, req.user.id]
                            );
                            inserted++;
                        }
                    }

                    // 2. For each regu in this subnit, assign 2 members
                    for (const regu of subnitRegus) {
                        const reguMembers = byRegu[regu.id] ? byRegu[regu.id].members : [];
                        if (reguMembers.length === 0) continue;

                        const membersToAssign = Math.min(2, reguMembers.length);

                        for (let count = 0; count < membersToAssign; count++) {
                            const idx = reguRotation[regu.id] % reguMembers.length;
                            const member = reguMembers[idx];
                            reguRotation[regu.id]++;

                            const [existing] = await db.query(
                                'SELECT id FROM duty_schedules WHERE tanggal = ? AND shift = ? AND user_id = ?',
                                [dateStr, shiftName, member.id]
                            );
                            if (existing.length === 0) {
                                await db.query(
                                    `INSERT INTO duty_schedules (tanggal, shift, user_id, subnit_id, regu_id, tipe, created_by) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                    [dateStr, shiftName, member.id, subnit.id, regu.id, tipe, req.user.id]
                                );
                                inserted++;
                            }
                        }
                    }
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
        }

        res.status(201).json({ message: `Jadwal berhasil di-generate: ${inserted} entri baru. (2 orang per Regu + Kasubnit/Kanit per shift per Zona)`, count: inserted });
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

// DELETE /api/schedules/clear/month/:tahun/:bulan — Delete all schedules for a specific month
router.delete('/clear/month/:tahun/:bulan', adminAuth, async (req, res) => {
    try {
        const { tahun, bulan } = req.params;
        const [result] = await db.query(
            'DELETE FROM duty_schedules WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ?',
            [tahun, bulan]
        );
        res.json({ message: `${result.affectedRows} entri jadwal bulan ${bulan}/${tahun} berhasil dihapus.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/schedules/clear/all — Delete ALL schedules in database
router.delete('/clear/all', adminAuth, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM duty_schedules');
        res.json({ message: `Seluruh entri jadwal (${result.affectedRows} entri) berhasil dihapus total.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
