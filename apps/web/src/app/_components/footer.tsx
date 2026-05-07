'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  {
    heading: 'Boutique',
    items: [
      { label: 'Tous les parfums', href: '/produits' },
      { label: 'Femme', href: '/produits?gender=FEMME' },
      { label: 'Homme', href: '/produits?gender=HOMME' },
      { label: 'Unisexe', href: '/produits?gender=UNISEXE' },
    ],
  },
  {
    heading: 'Mon compte',
    items: [
      { label: 'Connexion', href: '/connexion' },
      { label: 'Inscription', href: '/inscription' },
      { label: 'Mes commandes', href: '/compte' },
      { label: 'Ma wishlist', href: '/compte/favoris' },
    ],
  },
  {
    heading: 'Informations',
    items: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Livraison & retours', href: '/livraison' },
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
    ],
  },
];

export function Footer(): JSX.Element | null {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="mt-24 border-t border-brand-ink/10 bg-brand-ivory">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="font-serif text-xl text-brand-ink">
              Maison Parfum
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-brand-ink/50">
              Une sélection rigoureuse de parfums de niche et signatures pour esprits exigeants.
            </p>
          </div>

          {/* Nav columns */}
          {links.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-ink/40">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-brand-ink/70 transition-colors hover:text-brand-gold"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-ink/10 pt-8 sm:flex-row">
          <p className="text-xs text-brand-ink/40">
            © {new Date().getFullYear()} Maison Parfum. Tous droits réservés.
          </p>
          <p className="text-xs text-brand-ink/30">
            Made with ❤️ by <Link href="https://mikey.bio">MIKEY</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
