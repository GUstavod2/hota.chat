const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize the database table and pgvector extension
async function initDB() {
  if (!process.env.DATABASE_URL) return;
  
  try {
    const client = await pool.connect();
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536) -- text-embedding-3-small uses 1536 dimensions
      );
    `);
    client.release();
    console.log('Database initialized with pgvector');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = { pool, initDB };
