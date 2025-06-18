import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../app/api/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { searchTerm } = req.query;
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
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
} 