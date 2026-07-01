import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API auth route
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ds-session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await verifySession(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ds-session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|manifest.json|audio/).*)'],
};
