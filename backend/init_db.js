const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Drop and recreate database
    await connection.query(`DROP DATABASE IF EXISTS e_pikpor_db`);
    await connection.query(`CREATE DATABASE e_pikpor_db`);
    await connection.query(`USE e_pikpor_db`);
    console.log("✅ Database 'e_pikpor_db' created.");

    // ============================================================
    // TABLE: subnit
    // ============================================================
    await connection.query(`
      CREATE TABLE subnit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(50) NOT NULL,
        kode VARCHAR(10) NOT NULL UNIQUE,
        deskripsi VARCHAR(255),
        warna VARCHAR(7) DEFAULT '#3b82f6'
      )
    `);
    console.log("✅ Table 'subnit' created.");

    // ============================================================
    // TABLE: regu
    // ============================================================
    await connection.query(`
      CREATE TABLE regu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(50) NOT NULL,
        subnit_id INT NOT NULL,
        kode VARCHAR(20) NOT NULL UNIQUE,
        FOREIGN KEY (subnit_id) REFERENCES subnit(id)
      )
    `);
    console.log("✅ Table 'regu' created.");

    // ============================================================
    // TABLE: users
    // ============================================================
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    console.log("✅ Table 'users' created.");

    // ============================================================
    // TABLE: holidays (Hari Libur Nasional)
    // ============================================================
    await connection.query(`
      CREATE TABLE holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL,
        nama VARCHAR(255) NOT NULL,
        jenis ENUM('libur_nasional','cuti_bersama','libur_khusus') DEFAULT 'libur_nasional',
        tahun INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'holidays' created.");

    // ============================================================
    // TABLE: duty_schedules (Jadwal Piket)
    // ============================================================
    await connection.query(`
      CREATE TABLE duty_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL,
        shift ENUM('Pagi','Sore','Malam') NOT NULL,
        user_id INT NOT NULL,
        subnit_id INT NOT NULL,
        regu_id INT DEFAULT NULL,
        tipe ENUM('reguler','wiken','libur_nasional','khusus') DEFAULT 'reguler',
        status ENUM('dijadwalkan','hadir','tidak_hadir','izin') DEFAULT 'dijadwalkan',
        catatan TEXT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subnit_id) REFERENCES subnit(id),
        FOREIGN KEY (regu_id) REFERENCES regu(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'duty_schedules' created.");

    // ============================================================
    // TABLE: siaga_wiken (Event Siaga Wiken)
    // ============================================================
    await connection.query(`
      CREATE TABLE siaga_wiken (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal_mulai DATE NOT NULL,
        tanggal_selesai DATE NOT NULL,
        tipe ENUM('weekend','libur_nasional','cuti_bersama','khusus') NOT NULL,
        nama_event VARCHAR(255) NOT NULL,
        status ENUM('upcoming','active','completed') DEFAULT 'upcoming',
        catatan TEXT DEFAULT NULL,
        min_personel_per_zona INT DEFAULT 2,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'siaga_wiken' created.");

    // ============================================================
    // TABLE: siaga_wiken_personel (Personel yang ditugaskan)
    // ============================================================
    await connection.query(`
      CREATE TABLE siaga_wiken_personel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siaga_wiken_id INT NOT NULL,
        user_id INT NOT NULL,
        shift ENUM('Pagi','Sore','Malam') NOT NULL,
        status_checkin ENUM('belum','hadir','tidak_hadir') DEFAULT 'belum',
        waktu_checkin DATETIME DEFAULT NULL,
        catatan TEXT DEFAULT NULL,
        FOREIGN KEY (siaga_wiken_id) REFERENCES siaga_wiken(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'siaga_wiken_personel' created.");

    // ============================================================
    // TABLE: reports (Laporan Piket - Enhanced for Gakkum)
    // ============================================================
    await connection.query(`
      CREATE TABLE reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        lokasi VARCHAR(255) NOT NULL,
        zona ENUM('Barat','Timur','Tengah') NOT NULL DEFAULT 'Tengah',
        shift ENUM('Pagi','Sore','Malam') NOT NULL DEFAULT 'Pagi',
        waktu_kejadian DATETIME NOT NULL,
        deskripsi TEXT NOT NULL,
        kategori_gakkum ENUM('tilang','penderekan','razia','pengamanan','patroli','laka_lantas','lainnya') DEFAULT 'lainnya',
        tindakan TEXT DEFAULT NULL,
        pasal_pelanggaran VARCHAR(255) DEFAULT NULL,
        foto TEXT DEFAULT NULL,
        pelapor_id INT NOT NULL,
        status ENUM('pending','dilimpahkan','selesai') DEFAULT 'pending',
        is_wiken BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pelapor_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'reports' created.");

    // ============================================================
    // TABLE: report_edit_history
    // ============================================================
    await connection.query(`
      CREATE TABLE report_edit_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    console.log("✅ Table 'report_edit_history' created.");

    // ============================================================
    // TABLE: handovers (Pelimpahan/Estafet)
    // ============================================================
    await connection.query(`
      CREATE TABLE handovers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        regu_pengirim_id INT NOT NULL,
        regu_penerima_id INT NOT NULL,
        waktu_pelimpahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        catatan TEXT,
        status_terima ENUM('menunggu','diterima','ditolak') DEFAULT 'menunggu',
        FOREIGN KEY (report_id) REFERENCES reports(id),
        FOREIGN KEY (regu_pengirim_id) REFERENCES users(id),
        FOREIGN KEY (regu_penerima_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'handovers' created.");

    // ============================================================
    // TABLE: sop_documents (SOP Digital)
    // ============================================================
    await connection.query(`
      CREATE TABLE sop_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        kategori ENUM('piket_reguler','siaga_wiken','pelimpahan','gakkum','umum') NOT NULL DEFAULT 'umum',
        konten TEXT NOT NULL,
        urutan INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'sop_documents' created.");

    // ============================================================
    // TABLE: notifications
    // ============================================================
    await connection.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        judul VARCHAR(255) NOT NULL,
        pesan TEXT NOT NULL,
        tipe ENUM('info','warning','danger','success') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'notifications' created.");

    console.log("\n📦 All tables created successfully!\n");

    // ============================================================
    // SEED: Subnit
    // ============================================================
    await connection.query(`INSERT INTO subnit (nama, kode, deskripsi, warna) VALUES
      ('Subnit Timur', 'TIMUR', 'Pemantauan wilayah Bandung bagian Timur', '#10b981'),
      ('Subnit Tengah', 'TENGAH', 'Pemantauan wilayah Bandung bagian Tengah', '#3b82f6'),
      ('Subnit Barat', 'BARAT', 'Pemantauan wilayah Bandung bagian Barat', '#f97316')
    `);
    console.log("✅ Seed: 3 Subnit inserted.");

    // ============================================================
    // SEED: Regu (3 per subnit = 9 total)
    // ============================================================
    await connection.query(`INSERT INTO regu (nama, subnit_id, kode) VALUES
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
    console.log("✅ Seed: 9 Regu inserted (3 per subnit).");

    // ============================================================
    // SEED: Users (Personel dari Struktur Organisasi)
    // ============================================================
    const defaultPass = await bcrypt.hash('epikpor2026', 10);
    const adminPass = await bcrypt.hash('admin123', 10);

    // Admin System
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role) VALUES
      ('admin', ?, 'Administrator Sistem', '-', '-', 'admin')
    `, [adminPass]);

    // Kanit Gakkum
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role) VALUES
      ('fiekry.adi', ?, 'FIEKRY ADI PERDANA, S.I.Kom.', 'AKP', '-', 'kanit')
    `, [defaultPass]);

    // Bamin Gakkum (no subnit - staff)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role) VALUES
      ('agret.devia', ?, 'AGRET DEVIA PRATIWI PUTRI', 'BRIPTU', '-', 'bamin'),
      ('mutiara.maulina', ?, 'MUTIARA MAULINA DEWI', 'BRIPDA', '-', 'bamin')
    `, [defaultPass, defaultPass]);

    // Kasubnit I (Subnit Timur: id=1) — manages Timur
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id) VALUES
      ('sucipto.ari', ?, 'SUCIPTO ARI WARDANI, S.A.P., M.A.P.', 'IPDA', '-', 'kasubnit', 1)
    `, [defaultPass]);

    // Kasubnit II (Subnit Barat: id=3) — manages Barat
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id) VALUES
      ('sari.wulandari', ?, 'SARI WULANDARI A., S.H., CPHR.', 'IPDA', '-', 'kasubnit', 3)
    `, [defaultPass]);

    // ---- SUBNIT TIMUR (subnit_id=1) ----
    // Regu 1 Timur (regu_id=1)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('watchid.khomarudin', ?, 'WATCHID KHOMARUDIN', 'AIPDA', '-', 'danregu', 1, 1),
      ('dani.timur', ?, 'DANI', 'AIPDA', '-', 'anggota', 1, 1)
    `, [defaultPass, defaultPass]);
    // Regu 2 Timur (regu_id=2)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('ganepa.cahya', ?, 'GANEPA CAHYA FIRDAUS, S.H.', 'BRIPKA', '-', 'danregu', 1, 2),
      ('bambang.timur', ?, 'BAMBANG', 'AIPDA', '-', 'anggota', 1, 2)
    `, [defaultPass, defaultPass]);
    // Regu 3 Timur (regu_id=3)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('ibnu.narowi', ?, 'IBNU NAROWI, S.H.', 'AIPTU', '-', 'danregu', 1, 3)
    `, [defaultPass]);

    // ---- SUBNIT TENGAH (subnit_id=2) ----
    // Regu 1 Tengah (regu_id=4)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('siegit.dwi', ?, 'SIEGIT DWI HARYANTO, S.H.', 'AIPDA', '-', 'danregu', 2, 4),
      ('franciskus.goktua', ?, 'FRANCISKUS GOKTUA S', 'BRIPKA', '-', 'anggota', 2, 4)
    `, [defaultPass, defaultPass]);
    // Regu 2 Tengah (regu_id=5)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('adi.tengah', ?, 'ADI', 'AIPTU', '-', 'danregu', 2, 5),
      ('yanuar.tengah', ?, 'YANUAR', 'BRIPDA', '-', 'anggota', 2, 5)
    `, [defaultPass, defaultPass]);
    // Regu 3 Tengah (regu_id=6)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('ruhinda.tengah', ?, 'RUHINDA', 'AIPTU', '-', 'danregu', 2, 6),
      ('raja.putra', ?, 'RAJA PUTRA PERDANA', 'BRIPDA', '-', 'anggota', 2, 6)
    `, [defaultPass, defaultPass]);

    // ---- SUBNIT BARAT (subnit_id=3) ----
    // Regu 1 Barat (regu_id=7)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('toha.barat', ?, 'TOHA', 'AIPTU', '-', 'danregu', 3, 7),
      ('alvin.barat', ?, 'ALVIN', 'BRIPTU', '-', 'anggota', 3, 7)
    `, [defaultPass, defaultPass]);
    // Regu 2 Barat (regu_id=8)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('nandi.barat', ?, 'NANDI', 'AIPTU', '-', 'danregu', 3, 8),
      ('adam.barat', ?, 'ADAM', 'BRIPTU', '-', 'anggota', 3, 8)
    `, [defaultPass, defaultPass]);
    // Regu 3 Barat (regu_id=9)
    await connection.query(`INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
      ('indra.barat', ?, 'INDRA', 'AIPDA', '-', 'danregu', 3, 9),
      ('arizal.barat', ?, 'ARIZAL', 'BRIPDA', '-', 'anggota', 3, 9)
    `, [defaultPass, defaultPass]);

    console.log("✅ Seed: All personnel inserted (24 users).");

    // ============================================================
    // SEED: Hari Libur Nasional Indonesia 2026
    // ============================================================
    await connection.query(`INSERT INTO holidays (tanggal, nama, jenis, tahun) VALUES
      ('2026-01-01', 'Tahun Baru Masehi', 'libur_nasional', 2026),
      ('2026-01-29', 'Tahun Baru Imlek 2577', 'libur_nasional', 2026),
      ('2026-03-22', 'Isra Mi''raj Nabi Muhammad SAW', 'libur_nasional', 2026),
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
      ('2026-12-25', 'Hari Raya Natal', 'libur_nasional', 2026),
      ('2026-01-30', 'Cuti Bersama Tahun Baru Imlek', 'cuti_bersama', 2026),
      ('2026-03-30', 'Cuti Bersama Nyepi', 'cuti_bersama', 2026),
      ('2026-04-04', 'Cuti Bersama Wafat Isa Al-Masih', 'cuti_bersama', 2026),
      ('2026-05-15', 'Cuti Bersama Kenaikan Isa Al-Masih', 'cuti_bersama', 2026),
      ('2026-06-18', 'Cuti Bersama Idul Adha', 'cuti_bersama', 2026),
      ('2026-06-19', 'Cuti Bersama Idul Adha', 'cuti_bersama', 2026),
      ('2026-12-24', 'Cuti Bersama Natal', 'cuti_bersama', 2026),
      ('2026-12-26', 'Cuti Bersama Natal', 'cuti_bersama', 2026)
    `);
    console.log("✅ Seed: Hari Libur Nasional Indonesia 2026 inserted (22 entries).");

    // ============================================================
    // SEED: SOP Documents
    // ============================================================
    await connection.query(`INSERT INTO sop_documents (judul, kategori, konten, urutan, created_by) VALUES
      ('SOP Piket Reguler Harian', 'piket_reguler', '## SOP Piket Reguler Harian\\n\\n### A. Persiapan Piket\\n1. Personel piket hadir 15 menit sebelum pergantian shift\\n2. Melakukan pengecekan kelengkapan:\\n   - Surat perintah piket\\n   - Buku mutasi\\n   - Alat komunikasi (HT/HP)\\n   - Kendaraan dinas\\n   - Kelengkapan tilang\\n3. Melaporkan kesiapan kepada Danregu\\n\\n### B. Pelaksanaan Piket\\n1. Melaksanakan patroli sesuai zona yang ditentukan\\n2. Melakukan pengawasan dan penindakan pelanggaran lalu lintas\\n3. Membuat laporan setiap kejadian/kegiatan\\n4. Berkoordinasi dengan regu lain jika diperlukan\\n5. Menjaga komunikasi dengan Danregu/Kasubnit\\n\\n### C. Akhir Piket\\n1. Membuat resume kegiatan selama shift\\n2. Melimpahkan tugas yang belum selesai ke shift berikutnya\\n3. Menyerahkan kelengkapan piket\\n4. Melaporkan hasil piket kepada Danregu', 1, 2),

      ('SOP Siaga Wiken & Hari Libur Nasional', 'siaga_wiken', '## SOP Siaga Wiken & Hari Libur Nasional\\n\\n### A. Persiapan Siaga\\n1. Kanit/Kasubnit menentukan personel siaga minimal 3 hari sebelum weekend/libur\\n2. Personel wajib melakukan checkin digital melalui E-PIKPOR\\n3. Penguatan personel di setiap zona minimal 2 anggota per shift\\n4. Koordinasi dengan Kaur Bin Ops terkait situasi khusus\\n\\n### B. Pelaksanaan Siaga\\n1. Personel standby sesuai jadwal yang telah ditentukan\\n2. Intensifkan patroli di titik-titik rawan\\n3. Siaga di lokasi keramaian (mall, tempat wisata, jalur utama)\\n4. Laporan berkala setiap 2 jam kepada Danregu\\n5. Dokumentasi kegiatan dengan foto\\n\\n### C. Penanganan Kejadian\\n1. Segera laporkan kejadian melalui E-PIKPOR\\n2. Koordinasi dengan unit terkait jika diperlukan\\n3. Tindak lanjut sesuai prosedur\\n4. Estafet laporan ke shift berikutnya jika belum selesai\\n\\n### D. Selesai Siaga\\n1. Resume kegiatan selama siaga wiken\\n2. Evaluasi pelaksanaan siaga\\n3. Laporan akhir kepada Kanit Gakkum', 2, 2),

      ('SOP Pelimpahan Tugas Antar-Regu', 'pelimpahan', '## SOP Pelimpahan Tugas Antar-Regu (Estafet)\\n\\n### A. Syarat Pelimpahan\\n1. Tugas/kejadian yang belum terselesaikan dalam satu shift\\n2. Memerlukan tindak lanjut oleh regu shift berikutnya\\n3. Danregu pengirim wajib memberikan catatan lengkap\\n\\n### B. Prosedur Pelimpahan\\n1. Danregu membuka fitur Estafet di E-PIKPOR\\n2. Pilih laporan yang akan dilimpahkan\\n3. Pilih regu/shift penerima\\n4. Isi catatan pelimpahan (kronologi, progress, hal yang perlu ditindaklanjuti)\\n5. Kirim pelimpahan\\n\\n### C. Penerimaan Pelimpahan\\n1. Danregu penerima menerima notifikasi\\n2. Review detail laporan dan catatan pelimpahan\\n3. Terima atau Tolak pelimpahan\\n4. Jika diterima, lanjutkan penanganan\\n5. Update status laporan setelah selesai\\n\\n### D. Pelaporan\\n1. Catat hasil tindak lanjut di laporan\\n2. Update status menjadi SELESAI jika tuntas\\n3. Limpahkan kembali jika masih perlu tindak lanjut', 3, 2),

      ('SOP Penindakan Gakkum Lalu Lintas', 'gakkum', '## SOP Penindakan Gakkum Lalu Lintas\\n\\n### A. Tilang\\n1. Identifikasi pelanggaran lalu lintas\\n2. Hentikan kendaraan pelanggar\\n3. Periksa kelengkapan surat kendaraan dan SIM\\n4. Catat jenis pelanggaran dan pasal yang dilanggar\\n5. Terbitkan surat tilang\\n6. Input data ke E-PIKPOR dengan kategori TILANG\\n\\n### B. Penderekan\\n1. Identifikasi kendaraan yang parkir melanggar\\n2. Dokumentasi foto sebelum penderekan\\n3. Koordinasi dengan unit derek\\n4. Catat data kendaraan\\n5. Input ke E-PIKPOR dengan kategori PENDEREKAN\\n\\n### C. Razia\\n1. Persiapkan lokasi dan personel sesuai Surat Perintah\\n2. Koordinasi dengan unit terkait\\n3. Laksanakan razia sesuai prosedur\\n4. Dokumentasi seluruh kegiatan\\n5. Rekap hasil razia\\n6. Input ke E-PIKPOR dengan kategori RAZIA\\n\\n### D. Laka Lantas\\n1. Amankan TKP\\n2. Bantu korban jika ada\\n3. Dokumentasi dan olah TKP\\n4. Buat laporan kejadian\\n5. Input ke E-PIKPOR dengan kategori LAKA LANTAS', 4, 2)
    `);
    console.log("✅ Seed: 4 SOP Documents inserted.");

    // ============================================================
    // Done
    // ============================================================
    console.log("\n===========================================");
    console.log("  ✅ Database E-PIKPOR Initialized!");
    console.log("  📊 Tables: 12");
    console.log("  👥 Users: 24 personel");
    console.log("  📅 Holidays: 22 entries (2026)");
    console.log("  📑 SOP: 4 documents");
    console.log("===========================================");
    console.log("\n🔑 Login Admin: admin / admin123");
    console.log("🔑 Login Lainnya: [username] / epikpor2026\n");

  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await connection.end();
  }
}

initializeDB();
