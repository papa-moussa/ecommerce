import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protéger les routes /admin
  // setup-2fa est accessible sans cookie : l'utilisateur n'est pas encore pleinement authentifié
  // (il a seulement un tempToken en query param, pas de refresh_token cookie)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/setup-2fa')) {
    const sessionCookie = request.cookies.get('refresh_token'); // Le cookie s'appelle refresh_token

    // Si pas de cookie, redirection vers connexion
    if (!sessionCookie) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Note: Le middleware Edge ne peut pas facilement décoder un JWT complexe ou interroger la DB
    // Mais la présence du cookie est un premier rempart serveur.
    // Le rôle ADMIN sera vérifié par le layout admin ou les appels API.
  }

  // 2. Redirection /recherche -> /produits (Point T6.5)
  if (pathname === '/recherche') {
    return NextResponse.redirect(new URL('/produits', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/recherche'],
};
