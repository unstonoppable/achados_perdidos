import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../app/api/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { nome_pessoa_retirou, matricula_recebedor } = req.body;
  if (!nome_pessoa_retirou) {
    return res.status(400).json({ success: false, message: 'Nome da pessoa que retirou é obrigatório.' });
  }

  try {
    // Atualiza o item como entregue
    const updateQuery = `
      UPDATE itens
      SET status = 'entregue',
          nome_pessoa_retirou = $1,
          matricula_recebedor = $2,
          data_entrega = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await db.query(updateQuery, [nome_pessoa_retirou, matricula_recebedor || null, id]);
    if (rows.length > 0) {
      res.status(200).json({ success: true, item: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Item não encontrado para entrega.' });
    }
  } catch (error) {
    console.error('Erro ao marcar item como entregue:', error);
    res.status(500).json({ success: false, message: 'Erro ao marcar item como entregue.' });
  }
} 