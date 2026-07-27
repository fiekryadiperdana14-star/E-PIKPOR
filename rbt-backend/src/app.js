/**
 * ============================================
 * RBT Simulation Backend Server
 * Sekolah Polisi Negara (SPN) - Prolat Polri
 * ============================================
 * 
 * Tech Stack: Node.js + Express.js + MySQL (mysql2) 
 * 
 * Entry point untuk backend server.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { initGemini } = require('./config/gemini');
const authRoutes = require('./routes/auth.routes');
const simulationRoutes = require('./routes/simulation.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Global
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - izinkan frontend Angular
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Max 100 requests per IP per window
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi setelah 15 menit.',
  },
});
app.use('/api/', limiter);

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RBT Simulation API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Simulation routes
app.use('/api/simulations', simulationRoutes);

// ============================================
// Error Handling
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================
async function startServer() {
  console.log('============================================');
  console.log('  RBT Simulation Server - SPN Prolat Polri  ');
  console.log('============================================');

  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    try {
      const { pool } = require('./config/db');

      // Migration 1: language column
      const [langCol] = await pool.execute('SHOW COLUMNS FROM simulations LIKE "language"');
      if (langCol.length === 0) {
        await pool.execute("ALTER TABLE simulations ADD COLUMN language VARCHAR(10) DEFAULT 'id' AFTER status");
        console.log('✅ Migration: Added "language" column to simulations');
      }

      // Migration 2: EN cache columns in simulations
      const [judulEnCol] = await pool.execute('SHOW COLUMNS FROM simulations LIKE "judul_en"');
      if (judulEnCol.length === 0) {
        await pool.execute("ALTER TABLE simulations ADD COLUMN judul_en VARCHAR(500) DEFAULT NULL");
        await pool.execute("ALTER TABLE simulations ADD COLUMN narasi_kasus_en TEXT DEFAULT NULL");
        await pool.execute("ALTER TABLE simulations ADD COLUMN kata_kunci_en JSON DEFAULT NULL");
        await pool.execute("ALTER TABLE simulations ADD COLUMN legal_references_en JSON DEFAULT NULL");
        console.log('✅ Migration: Added EN cache columns to simulations');
      }

      // Migration 3: EN cache in simulation_results
      const [resultEnCol] = await pool.execute('SHOW COLUMNS FROM simulation_results LIKE "result_en"');
      if (resultEnCol.length === 0) {
        await pool.execute("ALTER TABLE simulation_results ADD COLUMN result_en JSON DEFAULT NULL");
        console.log('✅ Migration: Added "result_en" column to simulation_results');
      }

    } catch (dbErr) {
      console.error('Failed to run migration:', dbErr.message);
    }
  } else {
    console.warn('⚠️  Server berjalan tanpa koneksi database.');
    console.warn('   Pastikan MySQL sudah berjalan dan konfigurasi .env benar.');
  }

  // Initialize Gemini AI
  initGemini();

  // Start server
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API base URL: http://localhost:${PORT}/api`);
    console.log(`🔐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
    console.log(`\nEndpoints:`);
    console.log(`  POST   /api/auth/google       - Google OAuth Login`);
    console.log(`  GET    /api/auth/me            - Get Profile`);
    console.log(`  PUT    /api/auth/profile       - Update Profile`);
    console.log(`  POST   /api/simulations        - Create RBT Simulation`);
    console.log(`  GET    /api/simulations        - List Simulations`);
    console.log(`  GET    /api/simulations/:id    - Simulation Detail`);
    console.log(`  GET    /api/health             - Health Check`);
    console.log('============================================\n');
  });
}

startServer();

module.exports = app;
