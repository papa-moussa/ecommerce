import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (pathname.startsWith('/admin')) {
    if (!hasRefreshToken) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    // RBAC enforced by NestJS on every API call — this is UX-only shortcut
    return NextResponse.next();
  }

  if (pathname.startsWith('/compte')) {
    if (!hasRefreshToken) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/compte/:path*', '/admin/:path*'],
};
