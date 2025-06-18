import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Usuário não autenticado.' }, { status: 401 });
  }
  try {
    const secret = process.env.JWT_SECRET || 'secreta-temporaria';
    const decoded = jwt.verify(token, secret) as { id: number; nome: string; email: string; [key: string]: unknown };
    // Retorna os dados do usuário (exceto senha)
    return NextResponse.json({ success: true, user: decoded });
  } catch {
    return NextResponse.json({ success: false, message: 'Token inválido ou expirado.' }, { status: 401 });
  }
} 