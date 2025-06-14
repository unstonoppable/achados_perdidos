const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// Middleware para logging de rotas de autenticação
router.use((req, res, next) => {
  console.log('Auth Route:', req.method, req.path);
  next();
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
  }

  try {
    const query = 'SELECT id, nome, email, senha, tipo_usuario, foto_perfil_url FROM usuarios WHERE email = $1';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado com este e-mail.' });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.senha);

    if (match) {
      req.session.user = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        foto_perfil_url: user.foto_perfil_url
      };
      req.session.logged_in = true;

      return res.status(200).json({
        success: true,
        message: `Login bem-sucedido! Bem-vindo, ${user.nome}!`,
        user: req.session.user
      });
    } else {
      return res.status(401).json({ success: false, message: 'Senha incorreta.' });
    }
  } catch (error) {
    console.error('Erro no endpoint de login:', error);
    return res.status(500).json({ success: false, message: 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.' });
  }
});

router.post('/register', async (req, res) => {
  console.log('Recebendo requisição de registro:', req.body);
  
  const { nome, email, senha, confirmar_senha, matricula } = req.body;

  // Validações
  if (!nome || !email || !senha || !confirmar_senha || !matricula) {
    return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." });
  }
  if (senha !== confirmar_senha) {
    return res.status(400).json({ success: false, message: "As senhas não coincidem." });
  }
  if (senha.length < 6) {
    return res.status(400).json({ success: false, message: "A senha deve ter pelo menos 6 caracteres." });
  }
  // Idealmente, validar o formato do e-mail também
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Formato de e-mail inválido." });
  }

  try {
    // Verificar se email ou matrícula já existem
    let { rows } = await db.query("SELECT email, matricula FROM usuarios WHERE email = $1 OR matricula = $2", [email, matricula]);
    if (rows.length > 0) {
      if (rows[0].email === email) {
        return res.status(409).json({ success: false, message: "Este e-mail já está cadastrado." });
      }
      if (rows[0].matricula === matricula) {
        return res.status(409).json({ success: false, message: "Esta matrícula já está cadastrada." });
      }
    }

    // Hash da senha
    const saltRounds = 10;
    const senha_hashed = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário
    const insertQuery = `
      INSERT INTO usuarios (nome, email, senha, matricula, tipo_usuario) 
      VALUES ($1, $2, $3, $4, 'usuario')
      RETURNING id, nome, email, tipo_usuario, foto_perfil_url, matricula
    `;
    const newUserResult = await db.query(insertQuery, [nome, email, senha_hashed, matricula]);
    const user = newUserResult.rows[0];

    // Iniciar sessão
    req.session.user = user;
    req.session.logged_in = true;

    res.status(201).json({
      success: true,
      message: "Usuário cadastrado e logado com sucesso!",
      user: user
    });

  } catch (error) {
    console.error('Erro no endpoint de registro:', error);
    return res.status(500).json({ success: false, message: 'Ocorreu um erro interno no servidor.' });
  }
});

// GET /api/auth/me - Retorna os dados do usuário da sessão
router.get('/me', (req, res) => {
  if (req.session && req.session.logged_in && req.session.user) {
    const userData = {
      id: req.session.user.id,
      name: req.session.user.nome,
      email: req.session.user.email,
      photoUrl: req.session.user.foto_perfil_url,
      isAdmin: req.session.user.tipo_usuario === 'admin',
      matricula: req.session.user.matricula
    };
    res.status(200).json({ success: true, message: "Dados do usuário recuperados com sucesso.", user: userData });
  } else {
    res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
  }
});

// POST /api/auth/logout - Faz o logout do usuário
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Não foi possível fazer logout.' });
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        return res.status(200).json({ success: true, message: 'Logout bem-sucedido.' });
    });
});

module.exports = router; 