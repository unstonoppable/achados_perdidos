import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable, { File, Fields } from 'formidable';
import db from '../../app/api/config/db';
import jwt from 'jsonwebtoken';

// Função auxiliar para garantir string
function getField(fields: Fields, key: string): string | undefined {
  const value = fields[key];
  if (Array.isArray(value)) return value[0];
  return value as string | undefined;
}

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: 'dar6eexin',
  api_key: '213834427188814',
  api_secret: 'n2FoqqFib0y8gMcsXKKc4zGBxR8',
});

// Desabilita o bodyParser padrão do Next.js para essa rota
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erro no formidable:', err);
        return res.status(500).json({ success: false, message: 'Erro ao processar o formulário.' });
      }

      const nome_item = getField(fields, 'nome_item');
      const descricao = getField(fields, 'descricao');
      const local_encontrado = getField(fields, 'local_encontrado');
      const data_encontrado = getField(fields, 'data_encontrado');
      const status = getField(fields, 'status');
      const turno_encontrado = getField(fields, 'turno_encontrado');
      const categoria = getField(fields, 'categoria');
      let id_usuario_encontrou = getField(fields, 'id_usuario_encontrou');

      // Pega o id do usuário autenticado do JWT se não veio do form
      if (!id_usuario_encontrou && req.cookies?.token) {
        try {
          const secret = process.env.JWT_SECRET || 'secreta-temporaria';
          const decoded = jwt.verify(req.cookies.token, secret) as { id: number };
          id_usuario_encontrou = decoded.id?.toString();
        } catch {
          // Se não conseguir decodificar, mantém null
        }
      }

      let foto_item_url = null;

      // Upload da imagem para o Cloudinary
      if (files.foto_item) {
        const file = Array.isArray(files.foto_item) ? files.foto_item[0] : files.foto_item;
        const uploadResult = await cloudinary.uploader.upload((file as File).filepath, {
          folder: 'itens',
          resource_type: 'image',
        });
        foto_item_url = uploadResult.secure_url;
      }

      if (!nome_item || !descricao || !local_encontrado || !data_encontrado || !status || !id_usuario_encontrou) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos.' });
      }

      try {
        const q = `INSERT INTO itens (nome_item, descricao, local_encontrado, data_encontrado, status, turno_encontrado, categoria, foto_item_url, id_usuario_encontrou) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
        const p = [
          nome_item,
          descricao,
          local_encontrado,
          data_encontrado,
          status,
          turno_encontrado || null,
          categoria || null,
          foto_item_url,
          id_usuario_encontrou,
        ];
        const { rows } = await db.query(q, p);
        return res.status(201).json({ success: true, message: 'Item cadastrado com sucesso!', item: rows[0] });
      } catch (error) {
        console.error('Erro ao criar item:', error);
        return res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao criar o item.' });
      }
    });
  } else if (req.method === 'GET') {
    // Listar itens com filtros
    const { status, search, category } = req.query;
    let baseQuery = 'SELECT * FROM itens';
    const conditions: string[] = [], params: unknown[] = [];
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
      return res.status(200).json({ success: true, items: rows });
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      return res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao buscar os itens.' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Método não permitido.' });
  }
} 