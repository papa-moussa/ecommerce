import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Maison Parfum — Boutique premium',
    template: '%s · Maison Parfum',
  },
  description: 'Une sélection rigoureuse de parfums de niche et signatures.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
