-- ============================================
-- RBT Simulation Database Schema
-- Sekolah Polisi Negara (SPN) - Prolat Polri
-- ============================================

CREATE DATABASE IF NOT EXISTS rbt_simulation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rbt_simulation;

-- ============================================
-- Tabel: users
-- Menyimpan data pengguna (login via Google OAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url TEXT,
    role ENUM('gadik', 'admin', 'peserta') DEFAULT 'gadik',
    spesialisasi ENUM('sabhara', 'reserse', 'intel', 'lantas', 'binmas') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB;

-- ============================================
-- Tabel: simulations
-- Menyimpan setiap sesi simulasi RBT
-- ============================================
CREATE TABLE IF NOT EXISTS simulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    judul VARCHAR(500) NOT NULL,
    narasi_kasus TEXT NOT NULL,
    kata_kunci JSON,
    spesialisasi ENUM('sabhara', 'reserse', 'intel', 'lantas', 'binmas') NOT NULL,
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_spesialisasi (spesialisasi),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- Tabel: legal_references
-- Pasal hukum hasil analisis dari Pasal.id API
-- ============================================
CREATE TABLE IF NOT EXISTS legal_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulation_id INT NOT NULL,
    pasal_number VARCHAR(100) NOT NULL,
    undang_undang VARCHAR(500) NOT NULL,
    deskripsi TEXT,
    ancaman_pidana TEXT,
    raw_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
) ENGINE=InnoDB;

-- ============================================
-- Tabel: simulation_results
-- Skenario RBT hasil generasi dari Google Gemini AI
-- ============================================
CREATE TABLE IF NOT EXISTS simulation_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulation_id INT NOT NULL,
    skenario_rbt JSON NOT NULL,
    tujuan_pelatihan TEXT,
    peralatan TEXT,
    langkah_langkah JSON,
    evaluasi_kriteria JSON,
    durasi_estimasi VARCHAR(100),
    tingkat_kesulitan ENUM('dasar', 'menengah', 'lanjutan') DEFAULT 'menengah',
    raw_gemini_response JSON,
    skor_akhir INT NULL,
    penilaian_tambahan INT NULL,
    evaluasi_mandiri TEXT NULL,
    checked_evaluations JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
) ENGINE=InnoDB;
