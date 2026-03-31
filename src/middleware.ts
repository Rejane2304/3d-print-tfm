/**
 * Middleware de Autorización
 * Protege rutas según el rol del usuario
 * Redirecciones automáticas según plan de implementación
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rutas protegidas por rol
const ADMIN_ROUTES = ['/admin'];
const CLIENT_ROUTES = ['/carrito', '/checkout', '/cuenta'];
const AUTH_ROUTES = ['/login', '/registro'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener token JWT de la sesión
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const isAuthenticated = !!token;
  const userRole = token?.rol as string;
  
  // ============================================
  // REGLA 1: Admin NO puede comprar
  // Si es ADMIN e intenta acceder a rutas de tienda
  // ============================================
  if (userRole === 'ADMIN') {
    // Verificar si intenta acceder a rutas de cliente
    const isClientRoute = CLIENT_ROUTES.some(route => 
      pathname.startsWith(route)
    );
    
    // También verificar /productos (catálogo público está permitido)
    const isShopRoute = pathname === '/carrito' || 
                       pathname.startsWith('/checkout') ||
                       pathname.startsWith('/cuenta');
    
    if (isClientRoute || isShopRoute) {
      console.log(`🚫 ADMIN intentó acceder a ${pathname} - Redirigiendo a /admin/dashboard`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  // ============================================
  // REGLA 2: Rutas de Admin solo para ADMIN
  // ============================================
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // No autenticado, redirigir a login
      console.log(`🔒 Usuario no autenticado intentó acceder a ${pathname}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (userRole !== 'ADMIN') {
      // Autenticado pero no es admin, redirigir a home
      console.log(`🚫 CLIENTE intentó acceder a ${pathname} - Redirigiendo a /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Es admin, permitir acceso
    return NextResponse.next();
  }
  
  // ============================================
  // REGLA 3: Rutas de Cliente (protegidas)
  // ============================================
  const isProtectedClientRoute = CLIENT_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedClientRoute) {
    if (!isAuthenticated) {
      // No autenticado, redirigir a login con callback
      console.log(`🔒 Usuario no autenticado intentó acceder a ${pathname}`);
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    
    if (userRole === 'ADMIN') {
      // Admin intenta acceder a ruta de cliente
      console.log(`🚫 ADMIN intentó acceder a ${pathname} - Redirigiendo a /admin/dashboard`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // Es cliente autenticado, permitir acceso
    return NextResponse.next();
  }
  
  // ============================================
  // REGLA 4: Redirección de Login/Registro
  // Usuarios autenticados no deben ver estas páginas
  // ============================================
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  
  if (isAuthRoute && isAuthenticated) {
    if (userRole === 'ADMIN') {
      // Admin autenticado en login → redirigir a admin
      console.log(`✅ Admin autenticado en ${pathname} - Redirigiendo a /admin/dashboard`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      // Cliente autenticado en login → redirigir a home
      console.log(`✅ Cliente autenticado en ${pathname} - Redirigiendo a /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Permitir acceso a todas las demás rutas
  return NextResponse.next();
}

// Configuración de matcher
// Aplicar middleware solo a rutas específicas
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    
    // Rutas específicas que necesitan protección
    '/admin/:path*',
    '/carrito',
    '/checkout/:path*',
    '/cuenta/:path*',
    '/login',
    '/registro',
  ],
};
