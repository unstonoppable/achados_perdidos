import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Para produção, a Vercel definirá a variável de ambiente DATABASE_URL.
// Para desenvolvimento local, estamos construindo a string de conexão
// a partir das variáveis em um arquivo .env (que você precisará criar).

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uoWlBSn8GAp5@ep-jolly-silence-a8ccl566-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export const dbPool = pool;

const db = {
  query: (text, params) => pool.query(text, params),
};
export default db; 