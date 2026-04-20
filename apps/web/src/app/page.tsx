import Link from 'next/link';

import { serverApi } from '@/lib/api';

import { ProductCard } from './_components/product-card';

export default async function HomePage(): Promise<JSX.Element> {
  const featured = await serverApi.products.featured().catch(() => []);

  return (
    <>
      <section className="bg-brand-ink px-4 py-24 text-center text-brand-ivory">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-brand-gold">Haute parfumerie</p>
        <h1 className="mb-6 font-serif text-5xl font-semibold md:text-7xl">Maison Parfum</h1>
        <p className="mx-auto mb-10 max-w-md leading-relaxed text-brand-ivory/60">
          Une sélection rigoureuse de parfums de niche et signatures, cueillis aux quatre coins du
          monde olfactif.
        </p>
        <Link
          href="/produits"
          className="inline-block rounded-full border border-brand-gold px-8 py-3 text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-ink"
        >
          Explorer le catalogue
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="mb-8 font-serif text-2xl text-brand-ink">Notre sélection</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/produits"
              className="text-sm text-brand-ink/50 underline underline-offset-4 transition-colors hover:text-brand-ink"
            >
              Voir tout le catalogue
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
