/**
 * Middleware to redirect /login and /register to /auth
 * Maintains compatibility with legacy URLs
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Redirigir /login a /auth
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(`/auth${search}`, request.url));
  }
  
  // Redirigir /register a /auth con tab=register
  if (pathname === '/register') {
    const url = new URL('/auth', request.url);
    // Preservar query params existentes
    if (search) {
      url.search = search;
    }
    // Add parameter to open register tab
    url.searchParams.set('tab', 'register');
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register'],
};
