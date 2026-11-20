import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware guarding protected application routes.
 * Checks for the presence of the authenticated session cookie.
 *
 * @param req - Incoming NextRequest instance.
 * @returns NextResponse allowing continuation or redirecting to `/login`.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page, auth API, static assets, and favicon
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('netdrill_session')?.value;

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
