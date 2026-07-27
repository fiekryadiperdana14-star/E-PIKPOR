const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware: verify JWT & admin/kanit role
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

// GET /api/users — List all users with subnit/regu info
router.get('/', adminAuth, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.username, u.role, u.nama_lengkap, u.pangkat, u.nrp, u.no_hp,
                   u.subnit_id, u.regu_id, u.is_active,
                   s.nama as subnit_nama, s.kode as subnit_kode,
                   r.nama as regu_nama, r.kode as regu_kode
            FROM users u
            LEFT JOIN subnit s ON u.subnit_id = s.id
            LEFT JOIN regu r ON u.regu_id = r.id
            ORDER BY 
                CASE u.role 
                    WHEN 'admin' THEN 1
                    WHEN 'kanit' THEN 2 
                    WHEN 'kasubnit' THEN 3 
                    WHEN 'bamin' THEN 4 
                    WHEN 'danregu' THEN 5 
                    WHEN 'anggota' THEN 6 
                    ELSE 7 
                END, 
                s.id, r.id
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/users — Create a new user
router.post('/', adminAuth, async (req, res) => {
    try {
        const { username, password, role, nama_lengkap, pangkat, nrp, no_hp, subnit_id, regu_id } = req.body;

        if (!username || !password || !role || !nama_lengkap) {
            return res.status(400).json({ message: 'Username, password, role, dan nama lengkap wajib diisi.' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username sudah digunakan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO users (username, password, role, nama_lengkap, pangkat, nrp, no_hp, subnit_id, regu_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [username, hashedPassword, role, nama_lengkap, pangkat || null, nrp || null, no_hp || null,
             subnit_id || null, regu_id || null]
        );

        res.status(201).json({
            message: 'Akun berhasil dibuat.',
            user: { id: result.insertId, username, role, nama_lengkap }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/users/:id — Update a user
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { username, password, role, nama_lengkap, pangkat, nrp, no_hp, subnit_id, regu_id } = req.body;
        const userId = req.params.id;

        if (!username || !role || !nama_lengkap) {
            return res.status(400).json({ message: 'Username, role, dan nama lengkap wajib diisi.' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username sudah digunakan oleh akun lain.' });
        }

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                `UPDATE users SET username=?, password=?, role=?, nama_lengkap=?, pangkat=?, nrp=?, no_hp=?, subnit_id=?, regu_id=? WHERE id=?`,
                [username, hashedPassword, role, nama_lengkap, pangkat || null, nrp || null, no_hp || null,
                 subnit_id || null, regu_id || null, userId]
            );
        } else {
            await db.query(
                `UPDATE users SET username=?, role=?, nama_lengkap=?, pangkat=?, nrp=?, no_hp=?, subnit_id=?, regu_id=? WHERE id=?`,
                [username, role, nama_lengkap, pangkat || null, nrp || null, no_hp || null,
                 subnit_id || null, regu_id || null, userId]
            );
        }

        res.json({ message: 'Akun berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/users/:id — Delete a user
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri.' });
        }

        const [reports] = await db.query('SELECT COUNT(*) as count FROM reports WHERE pelapor_id = ?', [userId]);
        const [handoversSent] = await db.query('SELECT COUNT(*) as count FROM handovers WHERE regu_pengirim_id = ?', [userId]);
        const [handoversReceived] = await db.query('SELECT COUNT(*) as count FROM handovers WHERE regu_penerima_id = ?', [userId]);

        const totalRelated = reports[0].count + handoversSent[0].count + handoversReceived[0].count;
        if (totalRelated > 0) {
            // Soft delete instead
            await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);
            return res.json({ message: 'Akun dinonaktifkan karena memiliki data terkait.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Akun berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
