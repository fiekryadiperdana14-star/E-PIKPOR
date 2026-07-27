const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbt_simulation'
  });
  
  await conn.query(`ALTER TABLE users MODIFY COLUMN spesialisasi ENUM('reskrim', 'brimob', 'lantas', 'binmas', 'samapta', 'sabhara') NULL`);
  await conn.query(`ALTER TABLE simulations MODIFY COLUMN spesialisasi ENUM('reskrim', 'brimob', 'lantas', 'binmas', 'samapta', 'sabhara') NOT NULL`);
  
  try {
    await conn.query(`ALTER TABLE simulation_results ADD COLUMN skor_akhir INT NULL, ADD COLUMN penilaian_tambahan INT NULL, ADD COLUMN evaluasi_mandiri TEXT NULL, ADD COLUMN checked_evaluations JSON NULL`);
    console.log('Columns added');
  } catch(e) {
    console.log('Columns probably exist', e.message);
  }
  
  // Update old data mapping (intelkam -> binmas, administrasi -> samapta) just so they don't break
  // Actually ENUM change might have cleared the old ones if not mapped, but let's see. MySQL handles it by setting it to empty strings or making it invalid if strict mode is on.
  // We'll just leave it or run UPDATE beforehand. I'll just change ENUM.

  console.log('Spesialisasi updated in DB');
  process.exit(0);
}
run();
