const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create a handover
router.post('/', async (req, res) => {
    const conn = await db.pool.connect();
    try {
        await conn.query('BEGIN');

        const { report_id, regu_pengirim_id, regu_penerima_id, catatan } = req.body;

        // Insert handover record
        await conn.query(
            'INSERT INTO handovers (report_id, regu_pengirim_id, regu_penerima_id, catatan, status_terima) VALUES ($1, $2, $3, $4, $5)',
            [report_id, regu_pengirim_id, regu_penerima_id, catatan, 'menunggu']
        );

        // Update report status to 'dilimpahkan'
        await conn.query(
            'UPDATE reports SET status = $1 WHERE id = $2',
            ['dilimpahkan', report_id]
        );

        await conn.query('COMMIT');
        res.status(201).json({ message: 'Laporan berhasil dilimpahkan ke regu berikutnya.' });
    } catch (error) {
        await conn.query('ROLLBACK');
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

// Get handovers intended for a specific team (regu_penerima_id)
router.get('/penerima/:id', async (req, res) => {
    try {
        const [handovers] = await db.query(`
            SELECT h.*, r.judul, r.lokasi, r.waktu_kejadian, 
                   CONCAT(u_pengirim.pangkat, ' ', u_pengirim.nama_lengkap) as pengirim 
            FROM handovers h
            JOIN reports r ON h.report_id = r.id
            JOIN users u_pengirim ON h.regu_pengirim_id = u_pengirim.id
            WHERE h.regu_penerima_id = ?
            ORDER BY h.waktu_pelimpahan DESC
        `, [req.params.id]);
        res.json(handovers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update handover status (accept or reject)
router.put('/:id', async (req, res) => {
    const conn = await db.pool.connect();
    try {
        await conn.query('BEGIN');
        const { status_terima, report_id } = req.body; // 'diterima' or 'ditolak'

        await conn.query(
            'UPDATE handovers SET status_terima = $1 WHERE id = $2',
            [status_terima, req.params.id]
        );

        // If accepted, update report status, maybe change owner/pelapor? Or keep pelapor as original and just mark as selesai or handled.
        // For simplicity, let's say if accepted, status report becomes 'diterima', but our ENUM only has pending, dilimpahkan, selesai.
        if (status_terima === 'diterima') {
            await conn.query('UPDATE reports SET status = $1 WHERE id = $2', ['selesai', report_id]);
        } else if (status_terima === 'ditolak') {
            await conn.query('UPDATE reports SET status = $1 WHERE id = $2', ['pending', report_id]);
        }

        await conn.query('COMMIT');
        res.json({ message: 'Pelimpahan berhasil ' + status_terima });
    } catch (error) {
        await conn.query('ROLLBACK');
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
