const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
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

// Middleware: admin only
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
        if (decoded.role !== 'admin' && decoded.role !== 'kanit') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin/kanit yang diizinkan.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all reports
router.get('/', async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT r.*, u.nama_lengkap as pelapor, u.pangkat as pelapor_pangkat,
                   s.nama as subnit_nama, s.kode as subnit_kode
            FROM reports r 
            JOIN users u ON r.pelapor_id = u.id 
            LEFT JOIN subnit s ON u.subnit_id = s.id
            ORDER BY r.created_at DESC
        `);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new report
router.post('/', upload.array('foto', 5), async (req, res) => {
    try {
        const { judul, lokasi, zona, shift, waktu_kejadian, deskripsi, pelapor_id, 
                kategori_gakkum, tindakan, pasal_pelanggaran } = req.body;
        
        let fotoData = null;
        if (req.files && req.files.length > 0) {
            const filenames = req.files.map(f => f.filename);
            fotoData = JSON.stringify(filenames);
        }

        // Check if today is weekend or holiday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const todayStr = today.toISOString().split('T')[0];
        const [holidayCheck] = await db.query("SELECT COUNT(*) as count FROM holidays WHERE tanggal = ?", [todayStr]);
        const isWiken = isWeekend || holidayCheck[0].count > 0;

        const [result] = await db.query(
            `INSERT INTO reports (judul, lokasi, zona, shift, waktu_kejadian, deskripsi, 
             kategori_gakkum, tindakan, pasal_pelanggaran, foto, pelapor_id, status, is_wiken) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [judul, lokasi, zona, shift, waktu_kejadian, deskripsi, 
             kategori_gakkum || 'lainnya', tindakan || null, pasal_pelanggaran || null,
             fotoData, pelapor_id, 'pending', isWiken]
        );
        
        res.status(201).json({ message: 'Laporan berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an existing report
router.put('/:id', async (req, res) => {
    try {
        const reportId = req.params.id;
        const { judul, lokasi, zona, shift, deskripsi, kategori_gakkum, tindakan, pasal_pelanggaran,
                user_id, editor_nama, editor_pangkat, editor_nrp } = req.body;

        await db.query(
            `UPDATE reports SET judul=?, lokasi=?, zona=?, shift=?, deskripsi=?, 
             kategori_gakkum=?, tindakan=?, pasal_pelanggaran=? WHERE id=?`,
            [judul, lokasi, zona, shift, deskripsi, kategori_gakkum, tindakan, pasal_pelanggaran, reportId]
        );

        // Insert into history
        await db.query(
            'INSERT INTO report_edit_history (report_id, user_id, editor_nama, editor_pangkat, editor_nrp) VALUES (?, ?, ?, ?, ?)',
            [reportId, user_id, editor_nama, editor_pangkat, editor_nrp]
        );

        res.json({ message: 'Laporan berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get report edit history
router.get('/:id/history', async (req, res) => {
    try {
        const reportId = req.params.id;
        const [history] = await db.query(
            'SELECT * FROM report_edit_history WHERE report_id = ? ORDER BY waktu_edit DESC',
            [reportId]
        );
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete report (Admin/Kanit Only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const reportId = req.params.id;
        await db.query('DELETE FROM report_edit_history WHERE report_id = ?', [reportId]);
        await db.query('DELETE FROM handovers WHERE report_id = ?', [reportId]);
        await db.query('DELETE FROM reports WHERE id = ?', [reportId]);
        res.json({ message: 'Laporan berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
