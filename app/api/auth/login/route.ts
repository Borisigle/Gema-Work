import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
    }

    const teacher = validateCredentials(username.trim(), password.trim());

    if (!teacher) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const token = await createSession({
      teacherId: teacher.id,
      teacherName: teacher.name,
      username: username.trim().toLowerCase(),
      isAdmin: teacher.isAdmin || false,
    });

    const response = NextResponse.json({ success: true, teacher });
    response.cookies.set('ds-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
