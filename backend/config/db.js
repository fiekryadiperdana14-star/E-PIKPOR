const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
// Vercel Neon integration injects channel_binding=require which crashes Node pg client
if (dbUrl) {
  dbUrl = dbUrl.replace('?channel_binding=require&', '?').replace('&channel_binding=require', '').replace('?channel_binding=require', '');
}
const poolConfig = dbUrl ? {
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
} : {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'e_pikpor_db',
  ssl: process.env.DB_SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : undefined
};

const pool = new Pool(poolConfig);

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
