const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDBV3() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'e_pikpor_db'
  });

  try {
    console.log("Menjalankan migrasi database v3...");

    // Alter Role column to VARCHAR
    try {
        await connection.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'anggota'`);
        console.log("✅ Kolom 'role' berhasil diubah menjadi VARCHAR(50).");
    } catch (e) {
        throw e;
    }

    console.log("Migrasi database v3 selesai! 🎉");
  } catch (error) {
    console.error("❌ Error migrasi database:", error);
  } finally {
    await connection.end();
  }
}

updateDBV3();
