import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/auth';

import { CartDrawer } from './_components/cart-drawer';
import { Header } from './_components/header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Maison Parfum — Boutique premium',
    template: '%s · Maison Parfum',
  },
  description: 'Une sélection rigoureuse de parfums de niche et signatures.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Header />
          <CartDrawer />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
