'use client';

import Link from 'next/link';

import { useAuth } from '@/lib/auth';

export function Header() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/20 bg-brand-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-serif text-xl font-bold tracking-wide text-brand-ink">
          Maison Parfum
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/produits"
            className="text-brand-ink/60 transition-colors hover:text-brand-ink"
          >
            Catalogue
          </Link>

          {!isLoading &&
            (user ? (
              <>
                <Link
                  href="/compte"
                  className="text-brand-ink/60 transition-colors hover:text-brand-ink"
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={() => void logout()}
                  className="text-xs text-brand-ink/40 transition-colors hover:text-brand-ink"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                className="rounded-full bg-brand-ink px-4 py-1.5 text-sm text-brand-ivory transition-colors hover:bg-brand-gold"
              >
                Connexion
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
