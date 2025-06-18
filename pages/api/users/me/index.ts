import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../app/api/config/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  // Autenticação via JWT (cookie)
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }
  let userId: number | null = null;
  try {
    const secret = process.env.JWT_SECRET || 'secreta-temporaria';
    const decoded = jwt.verify(token, secret) as { id: number };
    userId = decoded.id;
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const { nome, email, matricula } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    // Verificar se o novo e-mail já está em uso por outro usuário
    const { rows: emailRows } = await db.query("SELECT id FROM usuarios WHERE email = $1 AND id != $2", [email, userId]);
    if (emailRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso por outro usuário.' });
    }
    // Opcional: Verificar matrícula duplicada também
    if (matricula) {
      const { rows: matriculaRows } = await db.query("SELECT id FROM usuarios WHERE matricula = $1 AND id != $2", [matricula, userId]);
      if (matriculaRows.length > 0) {
        return res.status(409).json({ success: false, message: 'Esta matrícula já está em uso por outro usuário.' });
      }
    }
    // Atualizar os dados
    const updateQuery = 'UPDATE usuarios SET nome = $1, email = $2, matricula = $3 WHERE id = $4 RETURNING id, nome, email, matricula, tipo_usuario, foto_perfil_url';
    const { rows } = await db.query(updateQuery, [nome, email, matricula || null, userId]);
    if (rows.length > 0) {
      res.status(200).json({ success: true, message: 'Dados atualizados com sucesso!', user: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Usuário não encontrado para atualização.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
  }
} 