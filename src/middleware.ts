/**
 * Authorization Middleware
 * Protects routes based on user role
 * Automatic redirects according to implementation plan
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';

  // Role-protected routes
// NOTE: /cart is NOT protected, works with localStorage for guests
const PROTECTED_CLIENT_ROUTES = ['/checkout', '/account'];
const AUTH_ROUTES = ['/login', '/auth'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ============================================
  // RATE LIMITING for Authentication Endpoints
  // ============================================
  // Apply rate limiting to API auth endpoints
  if (pathname === '/api/auth/callback/credentials') {
    const rateLimitResponse = checkRateLimit(request, 'login');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // ============================================
  // REDIRECTS: Legacy URL redirects
  // Handle /login and /register before auth checks
  // ============================================
  // Redirect /login to /auth
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(`/auth${search}`, request.url));
  }

  // Redirect /register to /auth with tab=register
  if (pathname === '/register') {
    const url = new URL('/auth', request.url);
    // Preserve existing query params
    if (search) {
      url.search = search;
    }
    // Add parameter to open register tab
    url.searchParams.set('tab', 'register');
    return NextResponse.redirect(url);
  }

  // Get JWT token from session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthenticated = !!token;
  const userRole = token?.rol as string;
  
  // ============================================
  // RULE 1: Admin cannot shop (but can access their profile)
  // ============================================
  if (userRole === 'ADMIN') {
    // First check if admin is accessing their profile/account pages
    const isProfileRoute = pathname === '/account' ||
                          pathname.startsWith('/account/profile') ||
                          pathname.startsWith('/account/perfil') ||
                          pathname.startsWith('/account/direcciones') ||
                          pathname.startsWith('/account/addresses') ||
                          pathname.startsWith('/account/orders') ||
                          pathname.startsWith('/account/pedidos');

    // Allow profile routes
    if (isProfileRoute) {
      return NextResponse.next();
    }

    // Check shop-only routes (cart, checkout)
    const isShopOnlyRoute = pathname === '/cart' ||
                           pathname.startsWith('/checkout');

    // Redirect admin away from shop-only routes
    if (isShopOnlyRoute) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // ============================================
  // RULE 2: Admin routes only for ADMIN
  // ============================================
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // Not authenticated, redirect to auth
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    if (userRole !== 'ADMIN') {
      // Authenticated but not admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Is admin, allow access
    return NextResponse.next();
  }
  
  // ============================================
  // RULE 3: Client routes (protected)
  // NOTE: /cart is NOT protected, works with localStorage for guests
  // Only /checkout and /account require authentication
  // ============================================
  const isProtectedClientRoute = PROTECTED_CLIENT_ROUTES.some((route: string) =>
    pathname.startsWith(route)
  );

  if (isProtectedClientRoute) {
    if (!isAuthenticated) {
      // Not authenticated, redirect to auth with callback
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/auth?callbackUrl=${callbackUrl}`, request.url)
      );
    }

    if (userRole === 'ADMIN') {
      // Admin tries to access client route
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Is authenticated client, allow access
    return NextResponse.next();
  }
  
  // ============================================
  // RULE 4: Login/Register Redirects
  // Authenticated users should not see these pages
  // Unless they have a callbackUrl (e.g., after adding to cart)
  // ============================================
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    // Check if there's a callbackUrl
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

    if (callbackUrl) {
      // If there's a callbackUrl, redirect there instead
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    if (userRole === 'ADMIN') {
      // Admin authenticated on login → redirect to admin
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      // Client authenticated on login → redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Matcher configuration
// Apply middleware only to specific routes
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

    // Specific routes that need protection
    '/admin/:path*',
    // '/cart' is not protected - works with localStorage
    '/checkout/:path*',
    '/account/:path*',
    '/login',
    '/register',
    '/auth',
    // Include auth callback for rate limiting
    '/api/auth/callback/credentials',
  ],
};
