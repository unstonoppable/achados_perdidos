import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  try {
    // Lê o arquivo schema.sql
    const schemaPath = path.join(path.dirname(''), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executa o schema
    await pool.query(schema);
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

migrate(); 