import type { Metadata } from 'next';

import { serverApi } from '@/lib/api';

import { ProductCard } from '../_components/product-card';

import { ProductFilters } from './_components/filters';

export const metadata: Metadata = {
  title: 'Catalogue',
  description: 'Découvrez notre sélection de parfums de niche et de créateurs.',
};

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProduitsPage({ searchParams }: Props): Promise<JSX.Element> {
  const category = str(searchParams['category']);
  const gender = str(searchParams['gender']);
  const sort = str(searchParams['sort']);
  const cursor = str(searchParams['cursor']);

  const params: Record<string, string> = { limit: '20' };
  if (category) params['category'] = category;
  if (gender) params['gender'] = gender;
  if (sort) params['sort'] = sort;
  if (cursor) params['cursor'] = cursor;

  const { data: products, nextCursor } = await serverApi.products.list(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Catalogue</h1>

      <div className="flex gap-10">
        <aside className="hidden w-48 shrink-0 lg:block">
          <ProductFilters activeGender={gender} activeSort={sort} />
        </aside>

        <div className="flex-1">
          {products.length === 0 ? (
            <p className="py-20 text-center text-brand-ink/40">
              Aucun parfum trouvé pour ces filtres.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {nextCursor && (
                <div className="mt-10 flex justify-center">
                  <a
                    href={`/produits?${new URLSearchParams({ ...params, cursor: nextCursor }).toString()}`}
                    className="rounded-full border border-brand-gold px-6 py-2 text-sm text-brand-ink transition-colors hover:bg-brand-gold hover:text-brand-ivory"
                  >
                    Voir plus
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
