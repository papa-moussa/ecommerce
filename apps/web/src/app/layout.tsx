import { Toaster } from '@ecommerce/ui';
import type { Metadata } from 'next';

import { JsonLd } from '@/components/json-ld';
import { PageTransition } from '@/components/page-transition';
import { AuthProvider } from '@/lib/auth';

import { CartDrawer } from './_components/cart-drawer';
import { Header } from './_components/header';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';

export const metadata: Metadata = {
  title: {
    default: 'Maison Parfum — Boutique premium',
    template: '%s · Maison Parfum',
  },
  description: 'Une sélection rigoureuse de parfums de niche et signatures.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    siteName: 'Maison Parfum',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Maison Parfum',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="fr">
      <body>
        <JsonLd data={organizationJsonLd} />
        <AuthProvider>
          <Header />
          <CartDrawer />
          <main>
            <PageTransition>{children}</PageTransition>
          </main>
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
