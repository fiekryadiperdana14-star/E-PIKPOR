const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const siagaWikenRoutes = require('./routes/siagaWikenRoutes');
const sopRoutes = require('./routes/sopRoutes');
const holidayRoutes = require('./routes/holidayRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/siaga-wiken', siagaWikenRoutes);
app.use('/api/sop', sopRoutes);
app.use('/api/holidays', holidayRoutes);

// Stats endpoint for dashboard
const db = require('./config/db');
app.get('/api/stats', async (req, res) => {
    try {
        const [totalReports] = await db.query('SELECT COUNT(*) as count FROM reports');
        const [pendingReports] = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
        const [handoverReports] = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'dilimpahkan'");
        const [completedReports] = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'selesai'");
        const [totalHandovers] = await db.query('SELECT COUNT(*) as count FROM handovers');
        const [pendingHandovers] = await db.query("SELECT COUNT(*) as count FROM handovers WHERE status_terima = 'menunggu'");
        const [totalPersonel] = await db.query("SELECT COUNT(*) as count FROM users WHERE is_active = TRUE AND role != 'admin'");
        const [todayReports] = await db.query("SELECT COUNT(*) as count FROM reports WHERE DATE(created_at) = CURDATE()");

        // Check if today is weekend or holiday
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const todayStr = today.toISOString().split('T')[0];
        const [holidayCheck] = await db.query("SELECT COUNT(*) as count FROM holidays WHERE tanggal = ?", [todayStr]);
        const isHoliday = holidayCheck[0].count > 0;
        const isSiagaWiken = isWeekend || isHoliday;

        // Get holiday name if applicable
        let holidayName = null;
        if (isHoliday) {
            const [hol] = await db.query("SELECT nama FROM holidays WHERE tanggal = ? LIMIT 1", [todayStr]);
            if (hol.length > 0) holidayName = hol[0].nama;
        }

        // Today's schedule count
        const [todaySchedule] = await db.query("SELECT COUNT(*) as count FROM duty_schedules WHERE tanggal = CURDATE()");

        // Active siaga wiken
        const [activeSiaga] = await db.query("SELECT COUNT(*) as count FROM siaga_wiken WHERE status = 'active'");

        // Per zona stats
        const [zonaStats] = await db.query(`
            SELECT s.kode as zona, s.nama, COUNT(DISTINCT ds.user_id) as personel_aktif
            FROM subnit s
            LEFT JOIN duty_schedules ds ON ds.subnit_id = s.id AND ds.tanggal = CURDATE()
            GROUP BY s.id, s.kode, s.nama
        `);

        res.json({
            totalReports: totalReports[0].count,
            pendingReports: pendingReports[0].count,
            handoverReports: handoverReports[0].count,
            completedReports: completedReports[0].count,
            totalHandovers: totalHandovers[0].count,
            pendingHandovers: pendingHandovers[0].count,
            totalPersonel: totalPersonel[0].count,
            todayReports: todayReports[0].count,
            todaySchedule: todaySchedule[0].count,
            activeSiaga: activeSiaga[0].count,
            isSiagaWiken,
            isWeekend,
            isHoliday,
            holidayName,
            zonaStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Org chart endpoint
app.get('/api/org-chart', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.nama_lengkap, u.pangkat, u.nrp, u.role, u.is_active,
                   s.nama as subnit_nama, s.kode as subnit_kode,
                   r.nama as regu_nama, r.kode as regu_kode
            FROM users u
            LEFT JOIN subnit s ON u.subnit_id = s.id
            LEFT JOIN regu r ON u.regu_id = r.id
            WHERE u.role != 'admin'
            ORDER BY 
                FIELD(u.role, 'kanit','kasubnit','bamin','danregu','anggota'),
                s.id, r.id
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Catch-all: serve index.html for any non-API route (SPA support)
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('===========================================');
    console.log('  E-PIKPOR Server Running');
    console.log('  Siaga Wiken System — Unit Gakkum');
    console.log('  Polrestabes Bandung');
    console.log('  URL: http://localhost:' + PORT);
    console.log('===========================================');
});

module.exports = app;
