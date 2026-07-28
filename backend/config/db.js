const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_NlekSq4fm5ao@ep-square-hall-au588gv0-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';
// Vercel Neon integration injects channel_binding=require which crashes Node pg client
if (dbUrl) {
  dbUrl = dbUrl.replace('?channel_binding=require&', '?').replace('&channel_binding=require', '').replace('?channel_binding=require', '');
}
const poolConfig = {
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const queryWrapper = async (sql, params) => {
  let pgSql = sql;
  
  // Replace MySQL '?' placeholders with PostgreSQL '$1, $2'
  if (params && params.length > 0) {
    let i = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
  }

  const result = await pool.query(pgSql, params);
  
  // Mimic mysql2 response format
  if (['INSERT', 'UPDATE', 'DELETE'].includes(result.command)) {
    const resultHeader = {
      affectedRows: result.rowCount,
      insertId: result.rows.length > 0 ? result.rows[0].id : null
    };
    return [resultHeader, result.fields];
  }
  
  return [result.rows, result.fields];
};

module.exports = {
  query: queryWrapper,
  pool,
  end: () => pool.end()
};
