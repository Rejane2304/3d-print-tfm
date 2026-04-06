/**
 * Authorization Middleware
 * Protects routes based on user role
 * Automatic redirects according to implementation plan
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

  // Role-protected routes
// NOTE: /cart is NOT protected, works with localStorage for guests
const PROTECTED_CLIENT_ROUTES = ['/checkout', '/account'];
const AUTH_ROUTES = ['/login', '/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
      console.log(`✅ ADMIN accessing profile at ${pathname} - Allowing`);
      return NextResponse.next();
    }

    // Check shop-only routes (cart, checkout)
    const isShopOnlyRoute = pathname === '/cart' ||
                           pathname.startsWith('/checkout');

    // Redirect admin away from shop-only routes
    if (isShopOnlyRoute) {
      console.log(`🚫 ADMIN tried to access ${pathname} - Redirecting to /admin/dashboard`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // ============================================
  // RULE 2: Admin routes only for ADMIN
  // ============================================
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // Not authenticated, redirect to auth
      console.log(`🔒 Unauthenticated user tried to access ${pathname}`);
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    if (userRole !== 'ADMIN') {
      // Authenticated but not admin, redirect to home
      console.log(`🚫 CLIENT tried to access ${pathname} - Redirecting to /`);
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
      console.log(`🔒 Unauthenticated user tried to access ${pathname}`);
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/auth?callbackUrl=${callbackUrl}`, request.url)
      );
    }

    if (userRole === 'ADMIN') {
      // Admin tries to access client route
      console.log(`🚫 ADMIN tried to access ${pathname} - Redirecting to /admin/dashboard`);
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
      console.log(`✅ Authenticated user on ${pathname} - Redirecting to callback: ${callbackUrl}`);
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    if (userRole === 'ADMIN') {
      // Admin authenticated on login → redirect to admin
      console.log(`✅ Admin authenticated on ${pathname} - Redirecting to /admin/dashboard`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      // Client authenticated on login → redirect to home
      console.log(`✅ Client authenticated on ${pathname} - Redirecting to /`);
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
  ],
};
