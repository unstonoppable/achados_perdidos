import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../app/api/config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Senha atual e nova senha são obrigatórias.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    // Buscar a senha atual do usuário
    const { rows } = await db.query('SELECT senha FROM usuarios WHERE id = $1', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
    const storedPasswordHash = (rows[0] as unknown as { senha: string }).senha;

    // Verificar se a senha atual está correta
    const match = await bcrypt.compare(currentPassword, storedPasswordHash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta.' });
    }

    // Gerar hash da nova senha e atualizar o banco
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar a senha:', error);
    res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao alterar a senha.' });
  }
} 