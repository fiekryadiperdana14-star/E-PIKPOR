const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDBV2() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'e_pikpor_db'
  });

  try {
    console.log("Menjalankan migrasi database v2...");

    // Add Pangkat and NRP to users
    try {
        await connection.query(`ALTER TABLE users ADD COLUMN pangkat VARCHAR(50) DEFAULT NULL AFTER nama_regu`);
        console.log("✅ Kolom 'pangkat' berhasil ditambahkan.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'pangkat' sudah ada.");
        else throw e;
    }

    try {
        await connection.query(`ALTER TABLE users ADD COLUMN nrp VARCHAR(50) DEFAULT NULL AFTER pangkat`);
        console.log("✅ Kolom 'nrp' berhasil ditambahkan.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'nrp' sudah ada.");
        else throw e;
    }

    // Create report_edit_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_edit_history (
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
    console.log("✅ Tabel 'report_edit_history' berhasil dibuat.");

    console.log("Migrasi database v2 selesai! 🎉");
  } catch (error) {
    console.error("❌ Error migrasi database:", error);
  } finally {
    await connection.end();
  }
}

updateDBV2();
