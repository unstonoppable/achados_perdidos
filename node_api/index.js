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
  'https://achados-perdidos-l1w9hnss1-unstonoppables-projects.vercel.app',
  'http://localhost:3000'
];

// Middleware para tratar requisições OPTIONS
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middlewares
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
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

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  console.log('Rota não encontrada:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 3001; // Mudei a porta para 3001 para não conflitar com o frontend

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 