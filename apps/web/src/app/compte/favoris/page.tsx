'use client';

import type { ProductCard as ProductCardType } from '@ecommerce/shared-types';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ProductCard } from '@/app/_components/product-card';
import { clientApi } from '@/lib/api';

export default function WishlistPage() {
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    clientApi.wishlist
      .list()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Mes Favoris</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="aspect-[3/4] w-full bg-brand-ink/5 rounded-2xl" />
              <div className="h-4 w-2/3 bg-brand-ink/5 rounded" />
              <div className="h-4 w-1/3 bg-brand-ink/5 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-brand-ink/40 mb-4">Vous n'avez pas encore de favoris.</p>
          <Link href="/produits" className="text-sm text-brand-gold hover:underline font-medium">
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onRemove={load} />
          ))}
        </div>
      )}
    </div>
  );
}
