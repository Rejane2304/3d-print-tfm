/**
 * Authorization Middleware
 * Protects routes based on user role
 * Automatic redirects according to implementation plan
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';

// Role-protected routes
const PROTECTED_CLIENT_ROUTES = ['/checkout', '/account'];
const AUTH_ROUTES = ['/login', '/auth'];

// Helper: Check rate limiting
function checkRateLimitIfNeeded(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname === '/api/auth/callback/credentials') {
    return checkRateLimit(request, 'login');
  }
  return null;
}

// Helper: Handle legacy redirects
function handleLegacyRedirects(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/login') {
    return NextResponse.redirect(new URL(`/auth${search}`, request.url));
  }

  if (pathname === '/register') {
    const url = new URL('/auth', request.url);
    if (search) {
      url.search = search;
    }
    url.searchParams.set('tab', 'register');
    return NextResponse.redirect(url);
  }

  return null;
}

// Helper: Check if route is profile route
function isProfileRoute(pathname: string): boolean {
  return (
    pathname === '/account' ||
    pathname.startsWith('/account/profile') ||
    pathname.startsWith('/account/perfil') ||
    pathname.startsWith('/account/direcciones') ||
    pathname.startsWith('/account/addresses') ||
    pathname.startsWith('/account/orders') ||
    pathname.startsWith('/account/pedidos')
  );
}

// Helper: Check if route is shop-only
function isShopOnlyRoute(pathname: string): boolean {
  return pathname === '/cart' || pathname.startsWith('/checkout');
}

// Helper: Handle admin access restrictions
function handleAdminRestrictions(request: NextRequest, userRole: string): NextResponse | null {
  if (userRole !== 'ADMIN') {
    return null;
  }

  const { pathname } = request.nextUrl;

  if (isProfileRoute(pathname)) {
    return NextResponse.next();
  }

  if (isShopOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return null;
}

// Helper: Handle admin routes
function handleAdminRoutes(request: NextRequest, isAuthenticated: boolean, userRole: string): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return null;
  }

  // Permitir /admin (la página se encargará de redirigir al dashboard o login)
  if (pathname === '/admin') {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Helper: Handle protected client routes
function handleProtectedRoutes(request: NextRequest, isAuthenticated: boolean, userRole: string): NextResponse | null {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_CLIENT_ROUTES.some(route => pathname.startsWith(route));

  if (!isProtected) {
    return null;
  }

  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${callbackUrl}`, request.url));
  }

  if (userRole === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

// Helper: Handle auth routes
function handleAuthRoutes(request: NextRequest, isAuthenticated: boolean, userRole: string): NextResponse | null {
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  if (!isAuthRoute || !isAuthenticated) {
    return null;
  }

  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  if (callbackUrl) {
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  if (userRole === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export async function middleware(request: NextRequest) {
  // Check rate limiting
  const rateLimitResponse = checkRateLimitIfNeeded(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Handle legacy redirects
  const redirectResponse = handleLegacyRedirects(request);
  if (redirectResponse) {
    return redirectResponse;
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const userRole = (token?.role as string) || '';

  // Rule 1: Admin restrictions
  const adminRestriction = handleAdminRestrictions(request, userRole);
  if (adminRestriction) {
    return adminRestriction;
  }

  // Rule 2: Admin routes
  const adminRouteResponse = handleAdminRoutes(request, isAuthenticated, userRole);
  if (adminRouteResponse) {
    return adminRouteResponse;
  }

  // Rule 3: Protected client routes
  const protectedResponse = handleProtectedRoutes(request, isAuthenticated, userRole);
  if (protectedResponse) {
    return protectedResponse;
  }

  // Rule 4: Auth routes
  const authResponse = handleAuthRoutes(request, isAuthenticated, userRole);
  if (authResponse) {
    return authResponse;
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Matcher configuration
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    '/admin/:path*',
    '/checkout/:path*',
    '/account/:path*',
    '/login',
    '/register',
    '/auth',
    '/api/auth/callback/credentials',
  ],
};
