const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'e_pikpor_db'
  });

  try {
    console.log("Menjalankan migrasi database...");

    // Add Zona column if it doesn't exist
    try {
        await connection.query(`ALTER TABLE reports ADD COLUMN zona ENUM('Barat', 'Timur', 'Tengah') DEFAULT 'Tengah' AFTER lokasi`);
        console.log("✅ Kolom 'zona' berhasil ditambahkan.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'zona' sudah ada.");
        else throw e;
    }

    // Add Shift column if it doesn't exist
    try {
        await connection.query(`ALTER TABLE reports ADD COLUMN shift ENUM('Pagi', 'Sore', 'Malam') DEFAULT 'Pagi' AFTER zona`);
        console.log("✅ Kolom 'shift' berhasil ditambahkan.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("ℹ️ Kolom 'shift' sudah ada.");
        else throw e;
    }

    // Modify foto column to TEXT to hold JSON array
    await connection.query(`ALTER TABLE reports MODIFY COLUMN foto TEXT DEFAULT NULL`);
    console.log("✅ Kolom 'foto' berhasil diubah menjadi tipe TEXT.");

    console.log("Migrasi database selesai! 🎉");
  } catch (error) {
    console.error("❌ Error migrasi database:", error);
  } finally {
    await connection.end();
  }
}

updateDB();
