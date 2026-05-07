'use client';

import { useState } from 'react';

import { PriceDisplay } from '@/components/price-display';

import { AddToCartButton } from './add-to-cart-button';

interface Variant {
  id: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
}

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    brand: string;
    priceCents: number;
    stock: number;
    stockStatus: string;
    images: { url: string; isMain: boolean }[];
    variants: Variant[];
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  // If there are variants, default to the first in-stock variant, or just the first one
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length > 0 ? (product.variants[0] ?? null) : null,
  );

  const currentPrice = selectedVariant ? selectedVariant.priceCents : product.priceCents;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const mainImage = product.images.find((i) => i.isMain) ?? product.images[0];

  const isOutOfStock = selectedVariant
    ? selectedVariant.stock <= 0
    : product.stockStatus === 'OUT_OF_STOCK';

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-medium text-brand-ink">
          <PriceDisplay cents={currentPrice} />
        </span>
        {selectedVariant && (
          <span className="text-xs text-brand-ink/40">
            ({Math.round(currentPrice / selectedVariant.sizeMl).toLocaleString()} F CFA / ml)
          </span>
        )}
      </div>

      {/* Variants Selection */}
      {product.variants.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-brand-ink/40 font-semibold">
            Choisir la contenance
          </p>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={v.stock <= 0}
                onClick={() => setSelectedVariant(v)}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 px-6 py-3 transition-all ${
                  selectedVariant?.id === v.id
                    ? 'border-brand-gold bg-brand-gold/5 text-brand-ink'
                    : 'border-brand-ink/10 text-brand-ink/60 hover:border-brand-gold/50'
                } ${v.stock <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
              >
                <span className="text-base font-bold">{v.sizeMl} ml</span>
                <span className="text-[10px] opacity-70">
                  <PriceDisplay cents={v.priceCents ?? product.priceCents} />
                </span>
                {selectedVariant?.id === v.id && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] text-white">
                    ✓
                  </div>
                )}
                {v.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-[1px] w-full bg-red-400/50 rotate-12" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock Status */}
      <div className="min-h-[1.5rem] flex items-center gap-2">
        {isOutOfStock ? (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-red-600">
              Ce format est actuellement indisponible.
            </p>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-green-600">
              En stock{' '}
              {currentStock < 5 ? `(Plus que ${currentStock} disponibles)` : '- Expédié sous 24h'}
            </p>
          </>
        )}
      </div>

      {/* Add to Cart */}
      <AddToCartButton
        productId={product.id}
        name={product.name}
        brand={product.brand}
        imageUrl={mainImage?.url}
        unitPriceCents={currentPrice}
        stockStatus={isOutOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK'}
        selectedVariantId={selectedVariant?.id}
        selectedSizeMl={selectedVariant?.sizeMl}
        maxStock={currentStock}
      />
    </div>
  );
}
