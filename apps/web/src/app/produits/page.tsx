import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AlgoliaProductList } from './_components/algolia-list';

export const metadata: Metadata = {
  title: 'Notre Collection',
  description: 'Découvrez notre sélection de parfums de niche et de créateurs.',
};

export default function ProduitsPage(): JSX.Element {
  return (
    <div className="bg-brand-ivory min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&q=80&w=2000"
            alt="Collection Privée"
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-6 mt-10">
          <span className="inline-block mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">
            Boutique
          </span>
          <h1 className="font-serif text-5xl md:text-7xl text-white/95 mb-4">Notre Collection</h1>
          <p className="text-white/60 max-w-lg mx-auto text-sm">
            Une sélection rigoureuse des plus belles signatures olfactives, créées par les
            parfumeurs indépendants les plus talentueux.
          </p>
        </div>
      </section>

      {/* Main Content (Algolia) */}
      <div className="mx-auto max-w-[90rem] px-4 md:px-8 py-16">
        <Suspense fallback={<div className="h-96 animate-pulse bg-white/50 rounded-3xl" />}>
          <AlgoliaProductList />
        </Suspense>
      </div>

      {/* SEO & Expertise Footer Block */}
      <section className="border-t border-brand-gold/20 bg-[#F9F7F3] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl text-brand-ink mb-6">L'Art de la Sélection</h2>
          <p className="text-brand-ink/60 text-sm leading-relaxed mb-6">
            Chez Maison Parfum, nous croyons que chaque flacon doit raconter une histoire unique.
            Notre comité olfactif teste rigoureusement des centaines de créations pour ne retenir
            que l'excellence. Des sillages boisés les plus profonds aux accords floraux les plus
            aériens, notre collection est une invitation au voyage.
          </p>
          <p className="text-brand-ink/60 text-sm leading-relaxed">
            Nous avons à cœur de mettre en lumière les <strong>marques de niche</strong> et les{' '}
            <strong>parfumeurs indépendants</strong> qui bousculent les codes de la haute parfumerie
            par leur audace, la noblesse de leurs matières premières et la longévité exceptionnelle
            de leurs extraits.
          </p>
        </div>
      </section>
    </div>
  );
}
