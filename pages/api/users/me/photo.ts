import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import db from '../../../../app/api/config/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: 'dar6eexin',
  api_key: '213834427188814',
  api_secret: 'n2FoqqFib0y8gMcsXKKc4zGBxR8',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      multiples: false,
      filter: (part: { mimetype?: string | null }) => !!(part.mimetype && part.mimetype.startsWith('image/')),
    });

    const { files } = await new Promise<{ files: { [key: string]: File | File[] | undefined } }>((resolve) => {
      form.parse(req, (_err, _fields, files) => {
        resolve({ files });
      });
    });

    const fileRaw = files.profileImage;
    const file: File | undefined = Array.isArray(fileRaw) ? fileRaw[0] : fileRaw;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    // Upload para o Cloudinary
    try {
      const uploadResult = await cloudinary.uploader.upload(file.filepath, {
        folder: 'achados_perdidos/profile_pictures',
        public_id: `profile-${userId}-${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
      });
      // Salvar URL do Cloudinary no banco
      await db.query('UPDATE usuarios SET foto_perfil_url = $1 WHERE id = $2', [uploadResult.secure_url, userId]);
      // Apagar arquivo temporário
      fs.unlinkSync(file.filepath);
      return res.status(200).json({ success: true, message: 'Foto de perfil atualizada!', filePath: uploadResult.secure_url });
    } catch (dbErr: unknown) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
      console.error('Cloudinary error:', dbErr);
      return res.status(500).json({ success: false, message: dbErr instanceof Error ? dbErr.message : 'Erro ao enviar imagem para o Cloudinary.' });
    }
  } catch (error: unknown) {
    console.error('Erro no upload de foto de perfil:', error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Erro interno no servidor.' });
  }
} 