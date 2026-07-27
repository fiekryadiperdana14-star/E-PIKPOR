const mysql = require('mysql2/promise');

module.exports = async function(req, res) {
  try {
    // Vercel akan otomatis mengambil URL dari Environment Variables
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Aiven mewajibkan SSL
    });
    
    // Uji coba ambil data dari database Aiven
    const [rows] = await connection.execute('SELECT "Koneksi ke Aiven Database Berhasil!" AS pesan');
    await connection.end();
    
    res.status(200).json({ status: 'Sukses', hasil: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'Error', pesan: error.message });
  }
};
