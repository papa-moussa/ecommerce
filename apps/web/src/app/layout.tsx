import { Toaster } from '@ecommerce/ui';
import type { Metadata } from 'next';

import { ChatbaseWidget } from '@/components/chatbase-widget';
import { JsonLd } from '@/components/json-ld';
import { PageTransition } from '@/components/page-transition';
import { AuthProvider } from '@/lib/auth';
import { CurrencyProvider } from '@/lib/currency';
import { WishlistProvider } from '@/lib/wishlist-context';

import { CartDrawer } from './_components/cart-drawer';
import { Footer } from './_components/footer';
import { Header } from './_components/header';
import { Providers } from './providers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';

export const metadata: Metadata = {
  title: {
    default: 'Maison Parfum — Boutique premium',
    template: '%s · Maison Parfum',
  },
  description: 'Une sélection rigoureuse de parfums de niche et signatures.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/',
      'x-default': '/',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
        <CurrencyProvider>
          <AuthProvider>
            <Providers>
              <WishlistProvider>
                <Header />
                <CartDrawer />
                <main>
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
                <ChatbaseWidget />
                <Toaster position="bottom-right" richColors />
              </WishlistProvider>
            </Providers>
          </AuthProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
