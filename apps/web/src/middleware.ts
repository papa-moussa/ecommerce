import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SEC-004: Edge middleware — verify ADMIN role before granting access to /admin routes.
 *
 * Strategy:
 *  1. Check for `user_session` cookie (signed JWT set by the API on login/refresh).
 *  2. Verify the JWT signature using JWT_ACCESS_SECRET (available as a server-side env var).
 *  3. Check that the `role` claim equals 'ADMIN'.
 *
 * Why a separate user_session cookie instead of decoding the refresh_token?
 * The refresh_token is an opaque SHA-256 hash stored in the DB — it cannot be decoded.
 * The user_session JWT is a lightweight, verifiable token created solely for this check.
 * The actual API security boundary remains the Bearer access token verified by NestJS.
 */

const SESSION_COOKIE = 'user_session';
const ADMIN_PATHS = ['/admin'];

function getJwtSecret(): Uint8Array {
  const secret = process.env['JWT_ACCESS_SECRET'];
  if (!secret) {
    // Fail closed: if the secret is missing, deny all access to admin routes
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
}

async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return false;

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(sessionCookie.value, secret, {
      algorithms: ['HS256'],
    });
    return payload['role'] === 'ADMIN';
  } catch {
    // Expired, invalid signature, or malformed token → deny access
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect /admin routes
  // /admin/setup-2fa is accessible without a session: the user only has a
  // tempToken at this point and hasn't completed 2FA setup yet.
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && !pathname.startsWith('/admin/setup-2fa')) {
    // First gate: is the user logged in at all? (cheap cookie presence check)
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (!sessionCookie) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Second gate: is the user actually an ADMIN? (JWT verification)
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) {
      // Authenticated but not ADMIN → redirect to home (not login, to avoid
      // exposing that an admin panel exists at this path)
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Redirect /recherche → /produits
  if (pathname === '/recherche') {
    return NextResponse.redirect(new URL('/produits', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/recherche'],
};
