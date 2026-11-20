import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles user logout requests by clearing the session cookie and redirecting to the login screen.
 *
 * @param req - Incoming NextRequest instance.
 * @returns NextResponse redirecting to '/login' with expired cookie.
 */
export async function POST(req: NextRequest) {
  const loginUrl = new URL('/login', req.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set('netdrill_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
