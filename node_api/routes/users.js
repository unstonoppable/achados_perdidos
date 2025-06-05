const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');
const profileUpload = require('../config/profileUpload');
const fs = require('fs').promises;
const path = require('path');

// GET /api/users/search?searchTerm=... - Busca usuários por nome ou matrícula (apenas admin)
router.get('/search', [isAuthenticated, isAdmin], async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Termo de busca deve ter pelo menos 2 caracteres.' });
  }

  try {
    const searchQuery = 'SELECT id, nome, matricula FROM usuarios WHERE nome ILIKE $1 OR matricula ILIKE $1';
    const searchTermWildcard = `%${searchTerm}%`;
    const { rows } = await db.query(searchQuery, [searchTermWildcard]);

    res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao buscar usuários.' });
  }
});

// PUT /api/users/me - Atualizar dados do próprio perfil
router.put('/me', isAuthenticated, async (req, res) => {
  const { nome, email, matricula } = req.body;
  const user_id = req.session.user.id;

  // Validação
  if (!nome || !email) {
    return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    // Verificar se o novo e-mail já está em uso por outro usuário
    const { rows: emailRows } = await db.query("SELECT id FROM usuarios WHERE email = $1 AND id != $2", [email, user_id]);
    if (emailRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso por outro usuário.' });
    }
    
    // Opcional: Verificar matrícula duplicada também
    if (matricula) {
        const { rows: matriculaRows } = await db.query("SELECT id FROM usuarios WHERE matricula = $1 AND id != $2", [matricula, user_id]);
        if (matriculaRows.length > 0) {
            return res.status(409).json({ success: false, message: 'Esta matrícula já está em uso por outro usuário.' });
        }
    }

    // Atualizar os dados
    const updateQuery = 'UPDATE usuarios SET nome = $1, email = $2, matricula = $3 WHERE id = $4 RETURNING id, nome, email, matricula, tipo_usuario, foto_perfil_url';
    const { rows } = await db.query(updateQuery, [nome, email, matricula || null, user_id]);
    
    if (rows.length > 0) {
        // Atualizar os dados da sessão com as novas informações
        req.session.user = rows[0];
        res.status(200).json({ success: true, message: 'Dados atualizados com sucesso!', user: rows[0] });
    } else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado para atualização.' });
    }

  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
  }
});

// PUT /api/users/me/password - Alterar a senha do próprio usuário
router.put('/me/password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user_id = req.session.user.id;

  // Validação
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Senha atual e nova senha são obrigatórias.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    // 1. Buscar a senha atual do usuário
    const { rows } = await db.query('SELECT senha FROM usuarios WHERE id = $1', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
    const storedPasswordHash = rows[0].senha;

    // 2. Verificar se a senha atual está correta
    const match = await bcrypt.compare(currentPassword, storedPasswordHash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta.' });
    }

    // 3. Gerar hash da nova senha e atualizar o banco
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [newPasswordHash, user_id]);

    res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });

  } catch (error) {
    console.error('Erro ao alterar a senha:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao alterar a senha.' });
  }
});

// POST /api/users/me/photo - Atualizar a foto de perfil do usuário
router.post('/me/photo', isAuthenticated, profileUpload.single('profileImage'), async (req, res) => {
  const user_id = req.session.user.id;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo foi enviado.' });
  }

  const newPhotoUrl = req.file.path.replace(/\\/g, "/");

  try {
    // 1. Buscar a URL da foto antiga para exclusão
    const { rows: userRows } = await db.query('SELECT foto_perfil_url FROM usuarios WHERE id = $1', [user_id]);
    const oldPhotoUrl = userRows.length > 0 ? userRows[0].foto_perfil_url : null;

    // 2. Atualizar o banco de dados com a nova URL
    const { rows: updatedRows } = await db.query('UPDATE usuarios SET foto_perfil_url = $1 WHERE id = $2 RETURNING *', [newPhotoUrl, user_id]);
    
    // 3. Atualizar a sessão do usuário
    req.session.user = updatedRows[0];

    // 4. Deletar a foto antiga do servidor
    if (oldPhotoUrl) {
      try {
        await fs.unlink(path.join(__dirname, '..', oldPhotoUrl));
      } catch (fileError) {
        console.warn(`Não foi possível deletar a foto antiga: ${oldPhotoUrl}. Erro: ${fileError.message}`);
      }
    }

    res.status(200).json({ success: true, message: 'Foto de perfil atualizada com sucesso!', filePath: newPhotoUrl });

  } catch (error) {
    console.error('Erro ao fazer upload da foto de perfil:', error);
    // Tenta deletar o arquivo recém-enviado se ocorrer um erro no banco de dados
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Erro ao limpar arquivo após falha no upload:', cleanupError);
    }
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao atualizar a foto.' });
  }
});

module.exports = router; 