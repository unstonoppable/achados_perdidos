import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '../../config/db';
import jwt from 'jsonwebtoken';

// Tipagem explícita para o usuário
type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo_usuario: string;
  foto_perfil_url: string | null;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  try {
    const query = 'SELECT id, nome, email, senha, tipo_usuario, foto_perfil_url FROM usuarios WHERE email = $1';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado com este e-mail.' }, { status: 404 });
    }

    const user = rows[0] as unknown as Usuario;
    const match = await bcrypt.compare(password, user.senha);

    if (match) {
      // Gerar JWT
      const secret = process.env.JWT_SECRET || 'secreta-temporaria';
      const token = jwt.sign(
        {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_usuario: user.tipo_usuario,
          foto_perfil_url: user.foto_perfil_url
        },
        secret,
        { expiresIn: '7d' }
      );
      // Definir cookie HTTP Only
      const response = NextResponse.json({
        success: true,
        message: `Login bem-sucedido! Bem-vindo, ${user.nome}!`,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_usuario: user.tipo_usuario,
          foto_perfil_url: user.foto_perfil_url
        }
      }, { status: 200 });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });
      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Senha incorreta.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Erro no endpoint de login:', error);
    return NextResponse.json({ success: false, message: 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.' }, { status: 500 });
  }
} 