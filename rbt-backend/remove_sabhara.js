const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbt_simulation'
  });
  
  console.log('UPDATING DB...');
  await conn.query(`ALTER TABLE users MODIFY COLUMN spesialisasi ENUM('reskrim', 'brimob', 'lantas', 'binmas', 'samapta') NULL`);
  await conn.query(`ALTER TABLE simulations MODIFY COLUMN spesialisasi ENUM('reskrim', 'brimob', 'lantas', 'binmas', 'samapta') NOT NULL`);
  
  console.log('Spesialisasi updated in DB (sabhara removed)');
  process.exit(0);
}
run().catch(err => {
    console.error(err);
    process.exit(1);
});
