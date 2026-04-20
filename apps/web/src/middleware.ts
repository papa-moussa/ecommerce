import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (!hasRefreshToken) {
    const url = new URL('/connexion', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/compte/:path*'],
};
