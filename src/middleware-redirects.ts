/**
 * Middleware para redirigir /login y /registro a /auth
 * Mantiene compatibilidad con URLs antiguas
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Redirigir /login a /auth
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(`/auth${search}`, request.url));
  }
  
  // Redirigir /registro a /auth con tab=register
  if (pathname === '/registro') {
    const url = new URL('/auth', request.url);
    // Preservar query params existentes
    if (search) {
      url.search = search;
    }
    // Añadir parámetro para abrir tab de registro
    url.searchParams.set('tab', 'register');
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/registro'],
};
