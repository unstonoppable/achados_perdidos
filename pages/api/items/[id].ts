import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../app/api/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { rows } = await db.query(`
        SELECT itens.*, usuarios.nome AS nome_usuario_encontrou
        FROM itens
        LEFT JOIN usuarios ON itens.id_usuario_encontrou = usuarios.id
        WHERE itens.id = $1
      `, [id]);
      if (rows.length > 0) {
        return res.status(200).json({ success: true, item: rows[0] });
      } else {
        return res.status(404).json({ success: false, message: 'Item não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao buscar item por ID:', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar item.' });
    }
  } else if (req.method === 'PUT') {
    try {
      // Buscar o item atual
      const { rows: currentRows } = await db.query('SELECT * FROM itens WHERE id = $1', [id]);
      if (currentRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Item não encontrado para atualização.' });
      }
      const current = currentRows[0] as unknown as {
        nome_item: string;
        descricao: string;
        local_encontrado: string;
        data_encontrado: string;
        status: string;
        turno_encontrado?: string;
        categoria?: string;
        foto_item_url?: string;
      };

      // Use os valores enviados ou mantenha os atuais
      const {
        nome_item = current.nome_item,
        descricao = current.descricao,
        local_encontrado = current.local_encontrado,
        data_encontrado = current.data_encontrado,
        status = current.status,
        turno_encontrado = current.turno_encontrado,
        categoria = current.categoria,
        foto_item_url = current.foto_item_url
      } = req.body;

      const q = `
        UPDATE itens
        SET nome_item = $1, descricao = $2, local_encontrado = $3, data_encontrado = $4, status = $5, turno_encontrado = $6, categoria = $7, foto_item_url = $8
        WHERE id = $9
        RETURNING *
      `;
      const p = [
        nome_item,
        descricao,
        local_encontrado,
        data_encontrado,
        status,
        turno_encontrado || null,
        categoria || null,
        foto_item_url || null,
        id
      ];

      const { rows } = await db.query(q, p);
      if (rows.length > 0) {
        return res.status(200).json({ success: true, item: rows[0] });
      } else {
        return res.status(404).json({ success: false, message: 'Item não encontrado para atualização.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar item.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const { rowCount } = await db.query('DELETE FROM itens WHERE id = $1', [id]);
      if ((rowCount ?? 0) > 0) {
        return res.status(200).json({ success: true, message: 'Item deletado com sucesso.' });
      } else {
        return res.status(404).json({ success: false, message: 'Item não encontrado para exclusão.' });
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      return res.status(500).json({ success: false, message: 'Erro ao deletar item.' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Método não permitido.' });
  }
} 