const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbt_simulation'
  });
  
  const [rows] = await conn.query('DESCRIBE simulation_results');
  console.log('COLUMNS IN simulation_results:');
  rows.forEach(r => console.log(`- ${r.Field}: ${r.Type} (Null: ${r.Null})`));
  
  const [rowsSim] = await conn.query('DESCRIBE simulations');
  console.log('\nCOLUMNS IN simulations:');
  rowsSim.forEach(r => console.log(`- ${r.Field}: ${r.Type} (Null: ${r.Null})`));
  
  process.exit(0);
}
run().catch(err => {
    console.error(err);
    process.exit(1);
});
