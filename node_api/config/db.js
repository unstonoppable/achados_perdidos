const { Pool } = require('pg');
require('dotenv').config();

// Para produção, a Vercel definirá a variável de ambiente DATABASE_URL.
// Para desenvolvimento local, estamos construindo a string de conexão
// a partir das variáveis em um arquivo .env (que você precisará criar).
const connectionString = process.env.DATABASE_URL || `postgresql://root:@localhost:5432/achados_e_perdidos`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uoWlBSn8GAp5@ep-jolly-silence-a8ccl566-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
}; 