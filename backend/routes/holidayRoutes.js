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
        if (!['admin', 'kanit'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
}

// GET /api/holidays — List all holidays
router.get('/', verifyToken, async (req, res) => {
    try {
        const { tahun } = req.query;
        let query = 'SELECT * FROM holidays';
        const params = [];
        if (tahun) {
            query += ' WHERE tahun = ?';
            params.push(parseInt(tahun));
        }
        query += ' ORDER BY tanggal ASC';
        const [holidays] = await db.query(query, params);
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/holidays/check/:date — Check if a date is a holiday
router.get('/check/:date', verifyToken, async (req, res) => {
    try {
        const [holidays] = await db.query(
            'SELECT * FROM holidays WHERE tanggal = ?',
            [req.params.date]
        );
        res.json({
            isHoliday: holidays.length > 0,
            holiday: holidays.length > 0 ? holidays[0] : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/holidays — Add a holiday
router.post('/', adminAuth, async (req, res) => {
    try {
        const { tanggal, nama, jenis } = req.body;
        const tahun = new Date(tanggal).getFullYear();

        // Check duplicate
        const [existing] = await db.query(
            'SELECT id FROM holidays WHERE tanggal = ?', [tanggal]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Tanggal sudah terdaftar sebagai hari libur.' });
        }

        const [result] = await db.query(
            'INSERT INTO holidays (tanggal, nama, jenis, tahun) VALUES (?, ?, ?, ?)',
            [tanggal, nama, jenis || 'libur_nasional', tahun]
        );
        res.status(201).json({ message: 'Hari libur berhasil ditambahkan.', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/holidays/:id — Update a holiday
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { tanggal, nama, jenis } = req.body;
        const tahun = new Date(tanggal).getFullYear();
        await db.query(
            'UPDATE holidays SET tanggal=?, nama=?, jenis=?, tahun=? WHERE id=?',
            [tanggal, nama, jenis, tahun, req.params.id]
        );
        res.json({ message: 'Hari libur berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/holidays/:id — Delete a holiday
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM holidays WHERE id = ?', [req.params.id]);
        res.json({ message: 'Hari libur berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
