import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AlgoliaProductList } from '../produits/_components/algolia-list';

export const metadata: Metadata = {
  title: 'Recherche — Maison Parfum',
  description: 'Recherchez votre signature olfactive parmi nos collections.',
};

export default function SearchPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-12">
        <h1 className="font-playfair text-4xl font-bold tracking-tight text-brand-ink mb-2">
          Recherche
        </h1>
        <p className="text-brand-ink/60">Explorez notre univers de fragrances d'exception.</p>
      </header>

      <Suspense fallback={<div className="h-96 animate-pulse bg-brand-ivory rounded-3xl" />}>
        <AlgoliaProductList />
      </Suspense>
    </div>
  );
}
