'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/reviews', label: 'Avis' },
  { href: '/admin/audit-log', label: 'Audit log' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 text-gray-200 flex flex-col">
        <div className="px-5 py-6 border-b border-gray-700">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Admin
          </span>
          <p className="text-white font-bold mt-1">Maison Parfum</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`block px-5 py-2.5 text-sm rounded-none transition-colors ${
                  active
                    ? 'bg-gray-700 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300">
            ← Retour boutique
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
