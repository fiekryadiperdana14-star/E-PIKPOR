const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
        if (!['admin'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Akses ditolak. Khusus Admin.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
}

// GET /api/org-leaders
router.get('/', async (req, res) => {
    try {
        const [leaders] = await db.query('SELECT * FROM org_leaders ORDER BY urutan ASC');
        res.json(leaders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/org-leaders
router.post('/', adminAuth, async (req, res) => {
    try {
        const { jabatan, nama_lengkap, pangkat, urutan } = req.body;
        const [result] = await db.query(
            'INSERT INTO org_leaders (jabatan, nama_lengkap, pangkat, urutan) VALUES (?, ?, ?, ?) RETURNING id',
            [jabatan, nama_lengkap, pangkat, urutan || 0]
        );
        res.status(201).json({ message: 'Pimpinan berhasil ditambahkan.', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/org-leaders/:id
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { jabatan, nama_lengkap, pangkat, urutan } = req.body;
        await db.query(
            'UPDATE org_leaders SET jabatan=?, nama_lengkap=?, pangkat=?, urutan=? WHERE id=?',
            [jabatan, nama_lengkap, pangkat, urutan || 0, req.params.id]
        );
        res.json({ message: 'Data pimpinan berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/org-leaders/:id
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM org_leaders WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pimpinan berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
