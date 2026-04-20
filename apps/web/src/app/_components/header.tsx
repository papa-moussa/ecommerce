'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/cart-store';

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { toggleCart, totalItems } = useCartStore();
  const count = totalItems();

  if (pathname.startsWith('/admin')) return null;

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

          {/* Cart button */}
          <button
            onClick={toggleCart}
            className="relative text-brand-ink/60 transition-colors hover:text-brand-ink"
            aria-label={`Panier — ${count} article${count !== 1 ? 's' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-semibold text-brand-ivory">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
