'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CurrencySelector } from '@/components/currency-selector';
import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/cart-store';
import { useWishlist } from '@/lib/wishlist-context';

import { HeaderSearch } from './header-search';
import { MobileMenu } from './mobile-menu';

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { toggleCart, totalItems } = useCartStore();
  const { wishlistIds } = useWishlist();
  const cartCount = totalItems();
  const wishlistCount = wishlistIds.size;

  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-50 bg-brand-ivory/95 backdrop-blur-md">
      {/* Main Top Bar */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* LEFT: Menu Mobile + Search */}
        <div className="flex flex-1 items-center gap-4">
          <MobileMenu />
          <div className="hidden md:block">
            <HeaderSearch />
          </div>
          <Link href="/recherche" className="md:hidden text-brand-ink/60" aria-label="Rechercher">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </Link>
        </div>

        {/* CENTER: Logo */}
        <div className="flex flex-1 justify-center">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-widest text-brand-ink md:text-3xl transition-transform hover:scale-105 duration-300"
          >
            Maison Parfum
          </Link>
        </div>

        {/* RIGHT: Currency, Account, Wishlist, Cart */}
        <nav className="flex flex-1 items-center justify-end gap-5 text-sm">
          <div className="hidden lg:flex items-center gap-5">
            <CurrencySelector />

            {!isLoading &&
              (user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-[10px] font-bold uppercase tracking-wider text-brand-gold hover:underline"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/compte"
                    className="text-xs font-medium text-brand-ink/70 transition-colors hover:text-brand-ink"
                  >
                    {user.firstName}
                  </Link>
                  <button
                    onClick={() => void logout()}
                    className="text-[10px] uppercase tracking-wider text-brand-ink/40 transition-colors hover:text-brand-ink"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  href="/connexion"
                  className="text-xs font-bold uppercase tracking-wider text-brand-ink/70 transition-colors hover:text-brand-gold"
                >
                  Connexion
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-5">
            {/* Wishlist button */}
            <Link
              href="/compte/favoris"
              className="relative text-brand-ink/60 transition-colors hover:text-brand-ink"
              aria-label="Mes favoris"
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
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-semibold text-brand-ivory">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative text-brand-ink/60 transition-colors hover:text-brand-ink"
              aria-label={`Panier — ${cartCount} article${cartCount !== 1 ? 's' : ''}`}
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
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-semibold text-brand-ivory">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Secondary Navigation Menu */}
      <div className="border-t border-brand-gold/10 bg-brand-ivory/50 hidden md:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-12 py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink/70">
          <Link href="/produits" className="transition-colors hover:text-brand-gold">
            Notre Collection
          </Link>
          <Link href="/univers/notes" className="transition-colors hover:text-brand-gold">
            Parfums & Notes
          </Link>
          <Link
            href="/quiz"
            className="flex items-center gap-2 transition-colors hover:text-brand-gold"
          >
            Quiz Parfum
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-gold"></span>
            </span>
          </Link>
          <Link href="/contact" className="transition-colors hover:text-brand-gold">
            Contactez-nous
          </Link>
        </nav>
      </div>
    </header>
  );
}
