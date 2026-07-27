const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await db.query(`
            SELECT u.id, u.username, u.password, u.role, u.nama_lengkap, u.pangkat, u.nrp, u.no_hp,
                   u.subnit_id, u.regu_id,
                   s.nama as subnit_nama, s.kode as subnit_kode,
                   r.nama as regu_nama, r.kode as regu_kode
            FROM users u
            LEFT JOIN subnit s ON u.subnit_id = s.id
            LEFT JOIN regu r ON u.regu_id = r.id
            WHERE u.username = ? AND u.is_active = TRUE
        `, [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User tidak ditemukan atau tidak aktif' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Password salah' });
        }

        // Create token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                nama_lengkap: user.nama_lengkap,
                subnit_id: user.subnit_id,
                regu_id: user.regu_id
            },
            process.env.JWT_SECRET || 'rahasia_negara',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                nama_lengkap: user.nama_lengkap,
                pangkat: user.pangkat,
                nrp: user.nrp,
                no_hp: user.no_hp,
                subnit_id: user.subnit_id,
                subnit_nama: user.subnit_nama,
                subnit_kode: user.subnit_kode,
                regu_id: user.regu_id,
                regu_nama: user.regu_nama,
                regu_kode: user.regu_kode
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// Get all non-admin users (for selecting which team to handover to)
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.username, u.role, u.nama_lengkap, u.pangkat,
                   s.nama as subnit_nama, r.nama as regu_nama
            FROM users u
            LEFT JOIN subnit s ON u.subnit_id = s.id
            LEFT JOIN regu r ON u.regu_id = r.id
            WHERE u.role != 'admin' AND u.is_active = TRUE
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
});

// Get subnit list
router.get('/subnit', async (req, res) => {
    try {
        const [subnit] = await db.query('SELECT * FROM subnit');
        res.json(subnit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get regu list
router.get('/regu', async (req, res) => {
    try {
        const [regu] = await db.query(`
            SELECT r.*, s.nama as subnit_nama 
            FROM regu r 
            JOIN subnit s ON r.subnit_id = s.id
        `);
        res.json(regu);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
