'use client';

import type { ProductCard } from '@ecommerce/shared-types';
import { Skeleton } from '@ecommerce/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { WishlistButton } from '@/components/wishlist-button';
import { clientApi } from '@/lib/api';
import { useCurrency } from '@/lib/currency';

export default function WishlistPage(): JSX.Element {
  const { format } = useCurrency();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clientApi.wishlist
      .list()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemove = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Mes favoris</h1>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-4 text-brand-ink/40">Votre liste de favoris est vide.</p>
          <Link
            href="/produits"
            className="text-sm font-medium text-brand-gold underline-offset-4 hover:underline"
          >
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const image = product.images[0];
            return (
              <div key={product.id} className="group relative">
                {/* Wishlist remove button */}
                <div className="absolute right-3 top-3 z-10">
                  <WishlistButton
                    productId={product.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white"
                    onRemove={() => handleRemove(product.id)}
                  />
                </div>

                <Link href={`/produits/${product.slug}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-sm">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt ?? `${product.brand} ${product.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-brand-ink/20">
                        —
                      </div>
                    )}
                    {product.stockStatus === 'OUT_OF_STOCK' && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-brand-ink/80 px-2.5 py-0.5 text-xs text-brand-ivory">
                        Épuisé
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-brand-ink/40">
                      {product.brand}
                    </p>
                    <h2 className="font-serif text-base text-brand-ink transition-colors group-hover:text-brand-gold">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium text-brand-ink">
                      {format(product.priceCents)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
