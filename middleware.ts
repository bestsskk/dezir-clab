import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('community_vip_session')?.value;

  // 1. Hide legacy /admin URL completely (return 404 Not Found)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.rewrite(new URL('/_not-found', request.url));
  }

  // 2. Protect member pages
  const isMemberRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profiles') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/account');

  if (isMemberRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Protect secret admin /likecrazy routes
  if (pathname === '/likecrazy/login') {
    return NextResponse.next();
  }

  if (pathname === '/likecrazy' || pathname.startsWith('/likecrazy/')) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/likecrazy/login', request.url));
    }
  }

  // If already logged in and visiting /login, let dashboard handle or redirect
  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profiles/:path*',
    '/profile/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/account/:path*',
    '/likecrazy/:path*',
    '/likecrazy',
    '/admin/:path*',
    '/admin',
    '/login',
  ],
};
