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

// GET /api/sop — List all SOP documents
router.get('/', verifyToken, async (req, res) => {
    try {
        const { kategori } = req.query;
        let query = `
            SELECT sd.*, u.nama_lengkap as created_by_nama
            FROM sop_documents sd
            LEFT JOIN users u ON sd.created_by = u.id
        `;
        const params = [];
        if (kategori) {
            query += ' WHERE sd.kategori = ?';
            params.push(kategori);
        }
        query += ' ORDER BY sd.urutan ASC, sd.created_at ASC';

        const [sops] = await db.query(query, params);
        res.json(sops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/sop/:id — Get single SOP
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [sops] = await db.query(`
            SELECT sd.*, u.nama_lengkap as created_by_nama
            FROM sop_documents sd
            LEFT JOIN users u ON sd.created_by = u.id
            WHERE sd.id = ?
        `, [req.params.id]);

        if (sops.length === 0) {
            return res.status(404).json({ message: 'SOP tidak ditemukan.' });
        }
        res.json(sops[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/sop — Create new SOP
router.post('/', adminAuth, async (req, res) => {
    try {
        const { judul, kategori, konten, urutan } = req.body;
        const [result] = await db.query(
            'INSERT INTO sop_documents (judul, kategori, konten, urutan, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id',
            [judul, kategori, konten, urutan || 0, req.user.id]
        );
        res.status(201).json({ message: 'SOP berhasil ditambahkan.', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/sop/:id — Update SOP
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { judul, kategori, konten, urutan, is_active } = req.body;
        await db.query(
            'UPDATE sop_documents SET judul=?, kategori=?, konten=?, urutan=?, is_active=? WHERE id=?',
            [judul, kategori, konten, urutan || 0, is_active !== undefined ? is_active : true, req.params.id]
        );
        res.json({ message: 'SOP berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/sop/:id — Delete SOP
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM sop_documents WHERE id = ?', [req.params.id]);
        res.json({ message: 'SOP berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
