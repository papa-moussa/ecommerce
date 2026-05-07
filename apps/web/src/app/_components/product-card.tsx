'use client';

import type { ProductCard } from '@ecommerce/shared-types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { WishlistButton } from '@/components/wishlist-button';
import { useCurrency } from '@/lib/currency';

export function ProductCard({
  product,
  onRemove,
}: {
  product: ProductCard;
  onRemove?: () => void;
}) {
  const { format } = useCurrency();
  const image = product.images[0];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <Link href={`/produits/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? `${product.brand} ${product.name}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-ink/20">
              —
            </div>
          )}

          <div className="absolute right-2 top-2 z-10">
            <WishlistButton
              productId={product.id}
              onRemove={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white"
            />
          </div>

          {product.stockStatus === 'OUT_OF_STOCK' && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-ink px-2.5 py-0.5 text-xs text-brand-ivory">
              Épuisé
            </span>
          )}
          {product.stockStatus === 'LOW_STOCK' && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2.5 py-0.5 text-xs text-white">
              Stock limité
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-xs uppercase tracking-widest text-brand-ink/40">{product.brand}</p>
          <h3 className="font-serif text-base text-brand-ink transition-colors group-hover:text-brand-gold">
            {product.name}
          </h3>

          <p className="text-sm font-medium text-brand-ink">
            {product.variants && product.variants.length > 1 && (
              <span className="text-[10px] font-normal text-brand-ink/40 mr-1 italic">
                À partir de
              </span>
            )}
            {format(
              product.variants && product.variants.length > 0
                ? Math.min(...product.variants.map((v) => v.priceCents ?? product.priceCents))
                : product.priceCents,
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
