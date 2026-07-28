const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

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

// GET /api/siaga-wiken — List all siaga wiken events
router.get('/', verifyToken, async (req, res) => {
    try {
        const [events] = await db.query(`
            SELECT sw.*, u.nama_lengkap as created_by_nama,
                   (SELECT COUNT(*) FROM siaga_wiken_personel WHERE siaga_wiken_id = sw.id) as total_personel,
                   (SELECT COUNT(*) FROM siaga_wiken_personel WHERE siaga_wiken_id = sw.id AND status_checkin = 'hadir') as hadir_count
            FROM siaga_wiken sw
            LEFT JOIN users u ON sw.created_by = u.id
            ORDER BY sw.tanggal_mulai DESC
        `);
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/siaga-wiken/active — Get currently active siaga wiken
router.get('/active', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [events] = await db.query(`
            SELECT sw.*, 
                   (SELECT COUNT(*) FROM siaga_wiken_personel WHERE siaga_wiken_id = sw.id) as total_personel,
                   (SELECT COUNT(*) FROM siaga_wiken_personel WHERE siaga_wiken_id = sw.id AND status_checkin = 'hadir') as hadir_count
            FROM siaga_wiken sw
            WHERE ? BETWEEN sw.tanggal_mulai AND sw.tanggal_selesai
            ORDER BY sw.tanggal_mulai ASC
        `, [today]);

        // Also get personnel for active events
        for (let event of events) {
            const [personel] = await db.query(`
                SELECT swp.*, u.nama_lengkap, u.pangkat, u.nrp,
                       s.nama as subnit_nama, r.nama as regu_nama
                FROM siaga_wiken_personel swp
                JOIN users u ON swp.user_id = u.id
                LEFT JOIN subnit s ON u.subnit_id = s.id
                LEFT JOIN regu r ON u.regu_id = r.id
                WHERE swp.siaga_wiken_id = ?
                ORDER BY 
                    CASE swp.shift 
                        WHEN 'Pagi' THEN 1 
                        WHEN 'Sore' THEN 2 
                        WHEN 'Malam' THEN 3 
                        ELSE 4 
                    END, 
                    u.nama_lengkap
            `, [event.id]);
            event.personel = personel;
        }

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/siaga-wiken — Create a new siaga wiken event
router.post('/', adminAuth, async (req, res) => {
    try {
        const { tanggal_mulai, tanggal_selesai, tipe, nama_event, catatan, min_personel_per_zona, personel_ids } = req.body;

        const [result] = await db.query(
            `INSERT INTO siaga_wiken (tanggal_mulai, tanggal_selesai, tipe, nama_event, catatan, min_personel_per_zona, created_by, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming') RETURNING id`,
            [tanggal_mulai, tanggal_selesai, tipe, nama_event, catatan || null, min_personel_per_zona || 2, req.user.id]
        );

        // Assign personnel if provided
        if (personel_ids && personel_ids.length > 0) {
            for (const p of personel_ids) {
                await db.query(
                    'INSERT INTO siaga_wiken_personel (siaga_wiken_id, user_id, shift) VALUES (?, ?, ?)',
                    [result.insertId, p.user_id, p.shift]
                );
            }
        }

        res.status(201).json({ message: 'Event Siaga Wiken berhasil dibuat', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/siaga-wiken/:id — Update status
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { status, catatan, nama_event } = req.body;
        await db.query('UPDATE siaga_wiken SET status = ?, catatan = ?, nama_event = COALESCE(?, nama_event) WHERE id = ?',
            [status, catatan, nama_event || null, req.params.id]);
        res.json({ message: 'Event Siaga Wiken berhasil diupdate.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/siaga-wiken/:id/checkin — Checkin for a siaga wiken
router.post('/:id/checkin', verifyToken, async (req, res) => {
    try {
        const siagaId = req.params.id;
        const userId = req.user.id;

        // Check if user is assigned
        const [assigned] = await db.query(
            'SELECT * FROM siaga_wiken_personel WHERE siaga_wiken_id = ? AND user_id = ?',
            [siagaId, userId]
        );

        if (assigned.length === 0) {
            return res.status(404).json({ message: 'Anda tidak ditugaskan pada event ini.' });
        }

        await db.query(
            `UPDATE siaga_wiken_personel SET status_checkin = 'hadir', waktu_checkin = NOW() 
             WHERE siaga_wiken_id = ? AND user_id = ?`,
            [siagaId, userId]
        );

        res.json({ message: 'Checkin berhasil! Terima kasih atas kehadiran Anda.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/siaga-wiken/:id/assign — Assign personnel
router.post('/:id/assign', adminAuth, async (req, res) => {
    try {
        const { user_id, shift } = req.body;
        const siagaId = req.params.id;

        const [existing] = await db.query(
            'SELECT id FROM siaga_wiken_personel WHERE siaga_wiken_id = ? AND user_id = ? AND shift = ?',
            [siagaId, user_id, shift]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Personel sudah ditugaskan pada shift ini.' });
        }

        await db.query(
            'INSERT INTO siaga_wiken_personel (siaga_wiken_id, user_id, shift) VALUES (?, ?, ?)',
            [siagaId, user_id, shift]
        );

        res.status(201).json({ message: 'Personel berhasil ditugaskan.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/siaga-wiken/:id — Delete event
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM siaga_wiken WHERE id = ?', [req.params.id]);
        res.json({ message: 'Event Siaga Wiken berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
