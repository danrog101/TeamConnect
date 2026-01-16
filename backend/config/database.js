const { Pool } = require('pg');

// Ekstrahuj credentials iz Supabase URL-a
const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = supabaseUrl.split('//')[1].split('.')[0]; // uehxqdxxkcfmkvvyxunv

const pool = new Pool({
  host: `aws-0-eu-central-1.pooler.supabase.com`,
  port: 6543,
  database: 'postgres',
  user: `postgres.${projectRef}`,
  password: process.env.SUPABASE_DB_PASSWORD, // Dodaj ovo u .env
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = pool;