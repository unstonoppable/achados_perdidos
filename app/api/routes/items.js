// Roteador para a funcionalidade de Itens
import express from 'express';
import db from '../../../pages/api/config/db.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import upload from '../config/multerConfig.js';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// GET /api/items/:id - Buscar um item específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM itens WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    if (rows.length > 0) res.status(200).json({ success: true, item: rows[0] });
    else res.status(404).json({ success: false, message: 'Item não encontrado.' });
  } catch (error) {
    console.error(`Erro ao buscar item por ID (${id}):`, error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao buscar o item.' });
  }
});

// GET /api/items - Listar todos os itens com filtros
router.get('/', async (req, res) => {
  const { status, search, category } = req.query;
  let baseQuery = 'SELECT * FROM itens';
  const conditions = [], params = [];
  let paramIndex = 1;

  if (status && status !== 'todos') {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (category && category !== 'todos' && category !== '') {
    conditions.push(`categoria = $${paramIndex++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(nome_item ILIKE $${paramIndex++} OR descricao ILIKE $${paramIndex++} OR local_encontrado ILIKE $${paramIndex++})`);
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  if (conditions.length > 0) baseQuery += ' WHERE ' + conditions.join(' AND ');
  baseQuery += ' ORDER BY data_cadastro_item DESC';

  try {
    const { rows } = await db.query(baseQuery, params);
    res.status(200).json({ success: true, items: rows });
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao buscar os itens.' });
  }
});

// POST /api/items - Criar um novo item
router.post('/', isAuthenticated, upload.single('foto_item'), async (req, res) => {
  const { nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado, categoria } = req.body;
  const id_usuario_encontrou = req.session.user.id;
  const foto_item_url = req.file ? req.file.path.replace(/\\/g, "/") : null;

  if (!nome_item || !descricao || !local_encontrado || !data_encontrado || !status) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos.' });
  }

  try {
    const q = `INSERT INTO itens (nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado, categoria, foto_item_url, id_usuario_encontrou) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    const p = [nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado || null, categoria || null, foto_item_url, id_usuario_encontrou];
    const { rows } = await db.query(q, p);
    res.status(201).json({ success: true, message: 'Item cadastrado com sucesso!', item: rows[0] });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    if (error instanceof multer.MulterError || error.message.includes('Apenas imagens')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao criar o item.' });
  }
});

// PUT /api/items/:id - Atualizar um item existente
router.put('/:id', isAuthenticated, upload.single('foto_item'), async (req, res) => {
  const { id } = req.params;
  const { nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado, categoria } = req.body;
  
  try {
    const { rows: itemRows } = await db.query('SELECT id_usuario_encontrou, foto_item_url FROM itens WHERE id = $1', [id]);
    if (itemRows.length === 0) return res.status(404).json({ success: false, message: 'Item a ser atualizado não encontrado.' });
    
    const item_original = itemRows[0];
    const { user } = req.session;
    if (user.tipo_usuario !== 'admin' && user.id !== item_original.id_usuario_encontrou) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este item.' });
    }
    
    const foto_item_url = req.file ? req.file.path.replace(/\\/g, "/") : item_original.foto_item_url;

    const q = `UPDATE itens SET nome_item=$1, descricao=$2, local_encontrado=$3, data_encontrado=$4, status=$5, turno_encontrado=$6, categoria=$7, foto_item_url=$8 WHERE id=$9 RETURNING *`;
    const p = [nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado || null, categoria || null, foto_item_url, id];
    
    const { rows: updatedRows } = await db.query(q, p);
    res.status(200).json({ success: true, message: 'Item atualizado com sucesso!', item: updatedRows[0] });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao atualizar o item.' });
  }
});

// DELETE /api/items/:id - Deletar um item
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: itemRows } = await db.query('SELECT id_usuario_encontrou, foto_item_url FROM itens WHERE id = $1', [id]);
    if (itemRows.length === 0) return res.status(404).json({ success: false, message: 'Item a ser deletado não encontrado.' });
    
    const item_to_delete = itemRows[0];
    const { user } = req.session;
    if (user.tipo_usuario !== 'admin' && user.id !== item_to_delete.id_usuario_encontrou) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para deletar este item.' });
    }
    
    await db.query('DELETE FROM itens WHERE id = $1', [id]);

    if (item_to_delete.foto_item_url) {
      try {
        await fs.unlink(path.join(__dirname, '..', item_to_delete.foto_item_url));
      } catch (fileError) {
        console.warn(`Não foi possível deletar o arquivo: ${item_to_delete.foto_item_url}. Erro: ${fileError.message}`);
      }
    }
    res.status(200).json({ success: true, message: 'Item deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao deletar o item.' });
  }
});

export default router;