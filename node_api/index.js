const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');

const app = express();

// Lista de domínios permitidos
const allowedOrigins = [
  'https://achados-perdidos-tau.vercel.app',
  'https://achados-perdidos-byai5x5kn-unstonoppables-projects.vercel.app',
  'http://localhost:3000'
];

// Middlewares
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'A política de CORS para este site não permite acesso da origem especificada.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
// TODO: Mova o segredo da sessão para uma variável de ambiente em um arquivo .env
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true em produção
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do Achados e Perdidos está funcionando!');
});

const PORT = process.env.PORT || 3001; // Mudei a porta para 3001 para não conflitar com o frontend

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 