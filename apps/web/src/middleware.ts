import { type NextRequest, NextResponse } from 'next/server';

// #82 — Content Security Policy
// Strategy: report-only first, then enforce once violations are triaged.
// Note: `unsafe-inline` for scripts is required by Next.js App Router hydration
// and dynamic JSON-LD tags until a nonce-based approach is implemented (Sprint 7).
function buildCspHeader(): string {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : 'http://localhost:3001';

  const directives: string[] = [
    "default-src 'self'",
    // Next.js hydration + JSON-LD dynamic scripts require unsafe-inline (documented exception)
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.sentry.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos`,
    `connect-src 'self' ${apiOrigin} https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io`,
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  return directives.join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (pathname.startsWith('/admin')) {
    if (!hasRefreshToken) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/compte')) {
    if (!hasRefreshToken) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  const csp = buildCspHeader();

  // Report-only: monitors violations without blocking. Switch to
  // Content-Security-Policy once violations are cleared in staging.
  response.headers.set('Content-Security-Policy-Report-Only', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/compte/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
