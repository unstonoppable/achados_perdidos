const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // Permite requisições do seu frontend
  credentials: true // Permite o envio de cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
// TODO: Mova o segredo da sessão para uma variável de ambiente em um arquivo .env
app.use(session({
  secret: 'mysecretkey', // Em um ambiente de produção, use uma variável de ambiente
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Defina como true se estiver usando HTTPS
    httpOnly: true,
    sameSite: 'lax'
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