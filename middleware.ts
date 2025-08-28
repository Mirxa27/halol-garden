import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateAuth } from './server/middleware/auth.middleware';

// Paths that require authentication
const protectedPaths = [
  '/admin',
  '/dashboard',
  '/profile',
  '/orders',
  '/cart',
  '/api/admin',
  '/api/orders',
  '/api/cart',
  '/api/upload',
];

// Paths that require admin access
const adminPaths = [
  '/admin',
  '/api/admin',
];

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/products',
  '/about',
  '/contact',
  '/api/auth',
  '/api/products',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    publicPaths.some(path => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const requiresAuth = protectedPaths.some(path => pathname.startsWith(path));
  const requiresAdmin = adminPaths.some(path => pathname.startsWith(path));

  if (requiresAuth) {
    // Validate authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.success) {
      // Redirect to login for web pages
      if (!pathname.startsWith('/api')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Return 401 for API routes
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin access if required
    if (requiresAdmin && authResult.user?.userType !== 'ADMIN') {
      if (!pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api') && authResult.user) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', authResult.user.id);
      requestHeaders.set('x-user-email', authResult.user.email);
      requestHeaders.set('x-user-type', authResult.user.userType);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}