
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sop_documents CASCADE;
DROP TABLE IF EXISTS handovers CASCADE;
DROP TABLE IF EXISTS report_edit_history CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS siaga_wiken_personel CASCADE;
DROP TABLE IF EXISTS siaga_wiken CASCADE;
DROP TABLE IF EXISTS duty_schedules CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS regu CASCADE;
DROP TABLE IF EXISTS subnit CASCADE;

CREATE TABLE subnit (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    kode VARCHAR(10) NOT NULL UNIQUE,
    deskripsi VARCHAR(255),
    warna VARCHAR(7) DEFAULT '#3b82f6'
);

CREATE TABLE regu (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    subnit_id INT NOT NULL,
    kode VARCHAR(20) NOT NULL UNIQUE,
    FOREIGN KEY (subnit_id) REFERENCES subnit(id)
);

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
);

CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    jenis VARCHAR(50) DEFAULT 'libur_nasional' CHECK (jenis IN ('libur_nasional','cuti_bersama','libur_khusus')),
    tahun INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);


INSERT INTO subnit (nama, kode, deskripsi, warna) VALUES
('Subnit Timur', 'TIMUR', 'Pemantauan wilayah Bandung bagian Timur', '#10b981'),
('Subnit Tengah', 'TENGAH', 'Pemantauan wilayah Bandung bagian Tengah', '#3b82f6'),
('Subnit Barat', 'BARAT', 'Pemantauan wilayah Bandung bagian Barat', '#f97316');

INSERT INTO regu (nama, subnit_id, kode) VALUES
('Regu 1', 1, 'TIMUR-R1'),
('Regu 2', 1, 'TIMUR-R2'),
('Regu 3', 1, 'TIMUR-R3'),
('Regu 1', 2, 'TENGAH-R1'),
('Regu 2', 2, 'TENGAH-R2'),
('Regu 3', 2, 'TENGAH-R3'),
('Regu 1', 3, 'BARAT-R1'),
('Regu 2', 3, 'BARAT-R2'),
('Regu 3', 3, 'BARAT-R3');

INSERT INTO users (username, password, nama_lengkap, pangkat, nrp, role, subnit_id, regu_id) VALUES
('admin', '$2b$10$t5Ft6zJyWlw.uyfl3VlFDeQFuhq7yXWlgKMNU/6WbyBTr5Vm.5Zey', 'Administrator Sistem', '-', '-', 'admin', NULL, NULL),
('fiekry.adi', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'FIEKRY ADI PERDANA, S.I.Kom.', 'AKP', '-', 'kanit', NULL, NULL),
('agret.devia', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'AGRET DEVIA PRATIWI PUTRI', 'BRIPTU', '-', 'bamin', NULL, NULL),
('mutiara.maulina', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'MUTIARA MAULINA DEWI', 'BRIPDA', '-', 'bamin', NULL, NULL),
('sucipto.ari', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'SUCIPTO ARI WARDANI, S.A.P., M.A.P.', 'IPDA', '-', 'kasubnit', 1, NULL),
('sari.wulandari', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'SARI WULANDARI A., S.H., CPHR.', 'IPDA', '-', 'kasubnit', 3, NULL),
('watchid.khomarudin', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'WATCHID KHOMARUDIN', 'AIPDA', '-', 'danregu', 1, 1),
('dani.timur', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'DANI', 'AIPDA', '-', 'anggota', 1, 1),
('ganepa.cahya', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'GANEPA CAHYA FIRDAUS, S.H.', 'BRIPKA', '-', 'danregu', 1, 2),
('bambang.timur', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'BAMBANG', 'AIPDA', '-', 'anggota', 1, 2),
('ibnu.narowi', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'IBNU NAROWI, S.H.', 'AIPTU', '-', 'danregu', 1, 3),
('siegit.dwi', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'SIEGIT DWI HARYANTO, S.H.', 'AIPDA', '-', 'danregu', 2, 4),
('franciskus.goktua', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'FRANCISKUS GOKTUA S', 'BRIPKA', '-', 'anggota', 2, 4),
('adi.tengah', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'ADI', 'AIPTU', '-', 'danregu', 2, 5),
('yanuar.tengah', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'YANUAR', 'BRIPDA', '-', 'anggota', 2, 5),
('ruhinda.tengah', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'RUHINDA', 'AIPTU', '-', 'danregu', 2, 6),
('raja.putra', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'RAJA PUTRA PERDANA', 'BRIPDA', '-', 'anggota', 2, 6),
('toha.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'TOHA', 'AIPTU', '-', 'danregu', 3, 7),
('alvin.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'ALVIN', 'BRIPTU', '-', 'anggota', 3, 7),
('nandi.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'NANDI', 'AIPTU', '-', 'danregu', 3, 8),
('adam.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'ADAM', 'BRIPTU', '-', 'anggota', 3, 8),
('indra.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'INDRA', 'AIPDA', '-', 'danregu', 3, 9),
('arizal.barat', '$2b$10$Q/FHS15qO9vnJ3mQfc8xfuaMin.cxckTcFo6IsMc/IGssxPa48iGG', 'ARIZAL', 'BRIPDA', '-', 'anggota', 3, 9);

INSERT INTO holidays (tanggal, nama, jenis, tahun) VALUES
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
('2026-12-25', 'Hari Raya Natal', 'libur_nasional', 2026);

INSERT INTO sop_documents (judul, kategori, konten, urutan, created_by) VALUES
('SOP Piket Reguler Harian', 'piket_reguler', '## SOP Piket Reguler Harian', 1, 2),
('SOP Siaga Wiken & Hari Libur Nasional', 'siaga_wiken', '## SOP Siaga Wiken & Hari Libur Nasional', 2, 2),
('SOP Pelimpahan Tugas Antar-Regu', 'pelimpahan', '## SOP Pelimpahan Tugas Antar-Regu (Estafet)', 3, 2),
('SOP Penindakan Gakkum Lalu Lintas', 'gakkum', '## SOP Penindakan Gakkum Lalu Lintas', 4, 2);
