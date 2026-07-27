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
            conditions.push('MONTH(ds.tanggal) = ? AND YEAR(ds.tanggal) = ?');
            params.push(parseInt(bulan), parseInt(tahun));
        }
        if (subnit_id) {
            conditions.push('ds.subnit_id = ?');
            params.push(parseInt(subnit_id));
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY ds.tanggal ASC, FIELD(ds.shift, "Pagi","Sore","Malam")';

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
            WHERE ds.tanggal = CURDATE()
            ORDER BY s.id, FIELD(ds.shift, 'Pagi','Sore','Malam'), u.nama_lengkap
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
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

        // Get all active regu members grouped by subnit
        const [personel] = await db.query(`
            SELECT u.id, u.subnit_id, u.regu_id, u.role 
            FROM users u 
            WHERE u.is_active = TRUE AND u.role IN ('danregu','anggota') AND u.subnit_id IS NOT NULL
            ORDER BY u.subnit_id, u.regu_id
        `);

        // Get subnit list
        const [subnits] = await db.query('SELECT * FROM subnit');

        // Get holidays in range
        const [holidays] = await db.query(
            'SELECT tanggal FROM holidays WHERE tanggal BETWEEN ? AND ?',
            [tanggal_mulai, tanggal_selesai]
        );
        const holidaySet = new Set(holidays.map(h => h.tanggal.toISOString().split('T')[0]));

        const shifts = ['Pagi', 'Sore', 'Malam'];
        let inserted = 0;

        // Group personel by subnit
        const bySubnit = {};
        personel.forEach(p => {
            if (!bySubnit[p.subnit_id]) bySubnit[p.subnit_id] = [];
            bySubnit[p.subnit_id].push(p);
        });

        // Generate schedule for each date
        let currentDate = new Date(tanggal_mulai);
        const endDate = new Date(tanggal_selesai);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidaySet.has(dateStr);
            const tipe = (isWeekend || isHoliday) ? (isHoliday ? 'libur_nasional' : 'wiken') : 'reguler';

            for (const subnit of subnits) {
                const members = bySubnit[subnit.id] || [];
                if (members.length === 0) continue;

                for (let shiftIdx = 0; shiftIdx < shifts.length; shiftIdx++) {
                    // Assign members round-robin to shifts
                    const memberIdx = (shiftIdx + Math.floor((currentDate.getTime() / 86400000)) ) % members.length;
                    const member = members[memberIdx];

                    // Check for duplicate
                    const [existing] = await db.query(
                        'SELECT id FROM duty_schedules WHERE tanggal = ? AND shift = ? AND user_id = ?',
                        [dateStr, shifts[shiftIdx], member.id]
                    );
                    if (existing.length === 0) {
                        await db.query(
                            `INSERT INTO duty_schedules (tanggal, shift, user_id, subnit_id, regu_id, tipe, created_by) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [dateStr, shifts[shiftIdx], member.id, subnit.id, member.regu_id, tipe, req.user.id]
                        );
                        inserted++;
                    }
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.status(201).json({ message: `Jadwal berhasil di-generate: ${inserted} entri baru.`, count: inserted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/schedules/:id — Update schedule
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { status, catatan } = req.body;
        await db.query('UPDATE duty_schedules SET status = ?, catatan = ? WHERE id = ?',
            [status, catatan, req.params.id]);
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
