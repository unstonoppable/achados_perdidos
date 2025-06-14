const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uoWlBSn8GAp5@ep-jolly-silence-a8ccl566-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...');
    
    // Lê o arquivo schema.sql
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executa o schema
    await pool.query(schema);
    console.log('Schema executado com sucesso!');

    // Verifica se as tabelas foram criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tabelas criadas:', tables.rows.map(row => row.table_name).join(', '));

  } catch (error) {
    console.error('Erro durante a configuração do banco de dados:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 