const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDB() {
  const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    ssl: process.env.DB_SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : undefined
  };

  const pool = new Pool(poolConfig);

  try {
    await pool.query(`DROP TABLE IF EXISTS notifications CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS sop_documents CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS handovers CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS report_edit_history CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS reports CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS siaga_wiken_personel CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS siaga_wiken CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS duty_schedules CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS holidays CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS regu CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS subnit CASCADE`);

    console.log("✅ Existing tables dropped.");

    await pool.query(`
      CREATE TABLE subnit (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(50) NOT NULL,
        kode VARCHAR(10) NOT NULL UNIQUE,
        deskripsi VARCHAR(255),
        warna VARCHAR(7) DEFAULT '#3b82f6'
      )
    `);

    await pool.query(`
      CREATE TABLE regu (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(50) NOT NULL,
        subnit_id INT NOT NULL,
        kode VARCHAR(20) NOT NULL UNIQUE,
        FOREIGN KEY (subnit_id) REFERENCES subnit(id)
      )
    `);

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(150) NOT NULL,
        pangkat VARCHAR(50) DEFAULT NULL,
        nrp VARCHAR(50) DEFAULT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'anggota',
        subnit_id INT DEFAULT NULL,
        regu_id INT DEFAULT NULL,
        no_hp VARCHAR(20) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subnit_id) REFERENCES subnit(id),
        FOREIGN KEY (regu_id) REFERENCES regu(id)
      )
    `);

    await pool.query(`
      CREATE TABLE holidays (
        id SERIAL PRIMARY KEY,
        tanggal DATE NOT NULL,
        nama VARCHAR(255) NOT NULL,
        jenis VARCHAR(50) DEFAULT 'libur_nasional' CHECK (jenis IN ('libur_nasional','cuti_bersama','libur_khusus')),
        tahun INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE duty_schedules (
        id SERIAL PRIMARY KEY,
        tanggal DATE NOT NULL,
        shift VARCHAR(20) NOT NULL CHECK (shift IN ('Pagi','Sore','Malam')),
        user_id INT NOT NULL,
        subnit_id INT NOT NULL,
        regu_id INT DEFAULT NULL,
        tipe VARCHAR(30) DEFAULT 'reguler' CHECK (tipe IN ('reguler','wiken','libur_nasional','khusus')),
        status VARCHAR(30) DEFAULT 'dijadwalkan' CHECK (status IN ('dijadwalkan','hadir','tidak_hadir','izin')),
        catatan TEXT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subnit_id) REFERENCES subnit(id),
        FOREIGN KEY (regu_id) REFERENCES regu(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE siaga_wiken (
        id SERIAL PRIMARY KEY,
        tanggal_mulai DATE NOT NULL,
        tanggal_selesai DATE NOT NULL,
        tipe VARCHAR(30) NOT NULL CHECK (tipe IN ('weekend','libur_nasional','cuti_bersama','khusus')),
        nama_event VARCHAR(255) NOT NULL,
        status VARCHAR(30) DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed')),
        catatan TEXT DEFAULT NULL,
        min_personel_per_zona INT DEFAULT 2,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE siaga_wiken_personel (
        id SERIAL PRIMARY KEY,
        siaga_wiken_id INT NOT NULL,
        user_id INT NOT NULL,
        shift VARCHAR(20) NOT NULL CHECK (shift IN ('Pagi','Sore','Malam')),
        status_checkin VARCHAR(30) DEFAULT 'belum' CHECK (status_checkin IN ('belum','hadir','tidak_hadir')),
        waktu_checkin TIMESTAMP DEFAULT NULL,
        catatan TEXT DEFAULT NULL,
        FOREIGN KEY (siaga_wiken_id) REFERENCES siaga_wiken(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        lokasi VARCHAR(255) NOT NULL,
        zona VARCHAR(20) NOT NULL DEFAULT 'Tengah' CHECK (zona IN ('Barat','Timur','Tengah')),
        shift VARCHAR(20) NOT NULL DEFAULT 'Pagi' CHECK (shift IN ('Pagi','Sore','Malam')),
        waktu_kejadian TIMESTAMP NOT NULL,
        deskripsi TEXT NOT NULL,
        kategori_gakkum VARCHAR(50) DEFAULT 'lainnya' CHECK (kategori_gakkum IN ('tilang','penderekan','razia','pengamanan','patroli','laka_lantas','lainnya')),
        tindakan TEXT DEFAULT NULL,
        pasal_pelanggaran VARCHAR(255) DEFAULT NULL,
        foto TEXT DEFAULT NULL,
        pelapor_id INT NOT NULL,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','dilimpahkan','selesai')),
        is_wiken BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pelapor_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE report_edit_history (
        id SERIAL PRIMARY KEY,
        report_id INT NOT NULL,
        user_id INT NOT NULL,
        editor_nama VARCHAR(100),
        editor_pangkat VARCHAR(50),
        editor_nrp VARCHAR(50),
        waktu_edit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE handovers (
        id SERIAL PRIMARY KEY,
        report_id INT NOT NULL,
        regu_pengirim_id INT NOT NULL,
        regu_penerima_id INT NOT NULL,
        waktu_pelimpahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        catatan TEXT,
        status_terima VARCHAR(30) DEFAULT 'menunggu' CHECK (status_terima IN ('menunggu','diterima','ditolak')),
        FOREIGN KEY (report_id) REFERENCES reports(id),
        FOREIGN KEY (regu_pengirim_id) REFERENCES users(id),
        FOREIGN KEY (regu_penerima_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE sop_documents (
        id SERIAL PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        kategori VARCHAR(50) NOT NULL DEFAULT 'umum' CHECK (kategori IN ('piket_reguler','siaga_wiken','pelimpahan','gakkum','umum')),
        konten TEXT NOT NULL,
        urutan INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        judul VARCHAR(255) NOT NULL,
        pesan TEXT NOT NULL,
        tipe VARCHAR(30) DEFAULT 'info' CHECK (tipe IN ('info','warning','danger','success')),
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ All tables created.");

    await pool.query(`INSERT INTO subnit (nama, kode, deskripsi, warna) VALUES
      ('Subnit Timur', 'TIMUR', 'Pemantauan wilayah Bandung bagian Timur', '#10b981'),
      ('Subnit Tengah', 'TENGAH', 'Pemantauan wilayah Bandung bagian Tengah', '#3b82f6'),
      ('Subnit Barat', 'BARAT', 'Pemantauan wilayah Bandung bagian Barat', '#f97316')
    `);

    await pool.query(`INSERT INTO regu (nama, subnit_id, kode) VALUES
      ('Regu 1', 1, 'TIMUR-R1'),
      ('Regu 2', 1, 'TIMUR-R2'),
      ('Regu 3', 1, 'TIMUR-R3'),
      ('Regu 1', 2, 'TENGAH-R1'),
      ('Regu 2', 2, 'TENGAH-R2'),
      ('Regu 3', 2, 'TENGAH-R3'),
      ('Regu 1', 3, 'BARAT-R1'),
      ('Regu 2', 3, 'BARAT-R2'),
      ('Regu 3', 3, 'BARAT-R3')
    `);

    const defaultPass = await bcrypt.hash('epikpor2026', 10);
    const adminPass = await bcrypt.hash('admin123', 10);

    const userQuery = `INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
    await pool.query(userQuery, ['admin', adminPass, 'Administrator Sistem', '-', '-', 'admin', null, null]);
    await pool.query(userQuery, ['fiekry.adi', defaultPass, 'FIEKRY ADI PERDANA, S.I.Kom.', 'AKP', '-', 'kanit', null, null]);
    await pool.query(userQuery, ['agret.devia', defaultPass, 'AGRET DEVIA PRATIWI PUTRI', 'BRIPTU', '-', 'bamin', null, null]);
    await pool.query(userQuery, ['mutiara.maulina', defaultPass, 'MUTIARA MAULINA DEWI', 'BRIPDA', '-', 'bamin', null, null]);
    await pool.query(userQuery, ['sucipto.ari', defaultPass, 'SUCIPTO ARI WARDANI, S.A.P., M.A.P.', 'IPDA', '-', 'kasubnit', 1, null]);
    await pool.query(userQuery, ['sari.wulandari', defaultPass, 'SARI WULANDARI A., S.H., CPHR.', 'IPDA', '-', 'kasubnit', 3, null]);
    await pool.query(userQuery, ['watchid.khomarudin', defaultPass, 'WATCHID KHOMARUDIN', 'AIPDA', '-', 'danregu', 1, 1]);
    await pool.query(userQuery, ['dani.timur', defaultPass, 'DANI', 'AIPDA', '-', 'anggota', 1, 1]);
    await pool.query(userQuery, ['ganepa.cahya', defaultPass, 'GANEPA CAHYA FIRDAUS, S.H.', 'BRIPKA', '-', 'danregu', 1, 2]);
    await pool.query(userQuery, ['bambang.timur', defaultPass, 'BAMBANG', 'AIPDA', '-', 'anggota', 1, 2]);
    await pool.query(userQuery, ['ibnu.narowi', defaultPass, 'IBNU NAROWI, S.H.', 'AIPTU', '-', 'danregu', 1, 3]);
    await pool.query(userQuery, ['siegit.dwi', defaultPass, 'SIEGIT DWI HARYANTO, S.H.', 'AIPDA', '-', 'danregu', 2, 4]);
    await pool.query(userQuery, ['franciskus.goktua', defaultPass, 'FRANCISKUS GOKTUA S', 'BRIPKA', '-', 'anggota', 2, 4]);
    await pool.query(userQuery, ['adi.tengah', defaultPass, 'ADI', 'AIPTU', '-', 'danregu', 2, 5]);
    await pool.query(userQuery, ['yanuar.tengah', defaultPass, 'YANUAR', 'BRIPDA', '-', 'anggota', 2, 5]);
    await pool.query(userQuery, ['ruhinda.tengah', defaultPass, 'RUHINDA', 'AIPTU', '-', 'danregu', 2, 6]);
    await pool.query(userQuery, ['raja.putra', defaultPass, 'RAJA PUTRA PERDANA', 'BRIPDA', '-', 'anggota', 2, 6]);
    await pool.query(userQuery, ['toha.barat', defaultPass, 'TOHA', 'AIPTU', '-', 'danregu', 3, 7]);
    await pool.query(userQuery, ['alvin.barat', defaultPass, 'ALVIN', 'BRIPTU', '-', 'anggota', 3, 7]);
    await pool.query(userQuery, ['nandi.barat', defaultPass, 'NANDI', 'AIPTU', '-', 'danregu', 3, 8]);
    await pool.query(userQuery, ['adam.barat', defaultPass, 'ADAM', 'BRIPTU', '-', 'anggota', 3, 8]);
    await pool.query(userQuery, ['indra.barat', defaultPass, 'INDRA', 'AIPDA', '-', 'danregu', 3, 9]);
    await pool.query(userQuery, ['arizal.barat', defaultPass, 'ARIZAL', 'BRIPDA', '-', 'anggota', 3, 9]);

    await pool.query(`INSERT INTO holidays (tanggal, nama, jenis, tahun) VALUES
      ('2026-01-01', 'Tahun Baru Masehi', 'libur_nasional', 2026),
      ('2026-01-29', 'Tahun Baru Imlek 2577', 'libur_nasional', 2026),
      ('2026-03-22', 'Isra Miraj Nabi Muhammad SAW', 'libur_nasional', 2026),
      ('2026-03-29', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'libur_nasional', 2026),
      ('2026-04-03', 'Wafat Isa Al-Masih', 'libur_nasional', 2026),
      ('2026-05-01', 'Hari Buruh Internasional', 'libur_nasional', 2026),
      ('2026-05-14', 'Kenaikan Isa Al-Masih', 'libur_nasional', 2026),
      ('2026-05-16', 'Hari Raya Waisak 2570', 'libur_nasional', 2026),
      ('2026-06-01', 'Hari Lahir Pancasila', 'libur_nasional', 2026),
      ('2026-06-17', 'Idul Adha 1447 Hijriyah', 'libur_nasional', 2026),
      ('2026-07-07', 'Tahun Baru Islam 1448 Hijriyah', 'libur_nasional', 2026),
      ('2026-08-17', 'Hari Kemerdekaan RI', 'libur_nasional', 2026),
      ('2026-09-15', 'Maulid Nabi Muhammad SAW', 'libur_nasional', 2026),
      ('2026-12-25', 'Hari Raya Natal', 'libur_nasional', 2026)
    `);

    console.log("✅ Database initialized for PostgreSQL!");

  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await pool.end();
  }
}

initializeDB();
