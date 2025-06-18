import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '../../config/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nome, email, senha, confirmar_senha, matricula } = body;

  // Validações
  if (!nome || !email || !senha || !confirmar_senha || !matricula) {
    return NextResponse.json({ success: false, message: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }
  if (senha !== confirmar_senha) {
    return NextResponse.json({ success: false, message: 'As senhas não coincidem.' }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, message: 'Formato de e-mail inválido.' }, { status: 400 });
  }

  try {
    // Tipagem explícita para o usuário retornado do banco
    type Usuario = {
      email: string;
      matricula: string;
    };

    // Verificar se email ou matrícula já existem
    const { rows } = await db.query('SELECT email, matricula FROM usuarios WHERE email = $1 OR matricula = $2', [email, matricula]);
    if (rows.length > 0) {
      const usuarioExistente = rows[0] as unknown as Usuario;
      if (usuarioExistente.email === email) {
        return NextResponse.json({ success: false, message: 'Este e-mail já está cadastrado.' }, { status: 409 });
      }
      if (usuarioExistente.matricula === matricula) {
        return NextResponse.json({ success: false, message: 'Esta matrícula já está cadastrada.' }, { status: 409 });
      }
    }

    // Hash da senha
    const saltRounds = 10;
    const senha_hashed = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário
    const insertQuery = `
      INSERT INTO usuarios (nome, email, senha, matricula, tipo_usuario)
      VALUES ($1, $2, $3, $4, 'usuario')
      RETURNING id, nome, email, tipo_usuario, foto_perfil_url, matricula
    `;
    const newUserResult = await db.query(insertQuery, [nome, email, senha_hashed, matricula]);
    const user = newUserResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: user
    }, { status: 201 });
  } catch (error) {
    console.error('Erro no endpoint de registro:', error);
    return NextResponse.json({ success: false, message: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
} 