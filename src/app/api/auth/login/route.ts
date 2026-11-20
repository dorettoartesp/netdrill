import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateSessionToken } from '@/lib/auth';

/**
 * Handles user login requests by verifying the submitted password and issuing a secure session cookie.
 *
 * @param req - Incoming NextRequest containing JSON payload with `password`.
 * @returns NextResponse with status confirmation or 401 unauthorized.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Senha incorreta. Verifique os dados informados e tente novamente.' },
        { status: 401 }
      );
    }

    const token = generateSessionToken();
    const response = NextResponse.json({
      message: 'Autenticação realizada com sucesso.',
    });

    response.cookies.set('netdrill_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Falha interna ao processar autenticação.' },
      { status: 500 }
    );
  }
}
