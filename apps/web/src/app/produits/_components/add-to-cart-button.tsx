'use client';

import { useState } from 'react';

import { useCartStore } from '@/lib/cart-store';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  unitPriceCents: number;
  stockStatus: string;
  selectedVariantId?: string;
  selectedSizeMl?: number;
}

export function AddToCartButton({
  productId,
  name,
  brand,
  imageUrl,
  unitPriceCents,
  stockStatus,
  selectedVariantId,
  selectedSizeMl,
}: AddToCartButtonProps) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);

  const outOfStock = stockStatus === 'OUT_OF_STOCK';

  function handleClick() {
    addItem({
      productId,
      variantId: selectedVariantId,
      name,
      brand,
      imageUrl,
      unitPriceCents,
      sizeMl: selectedSizeMl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={outOfStock}
      className="w-full rounded-full bg-brand-ink py-3 font-medium text-brand-ivory transition-colors hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {outOfStock ? 'Épuisé' : added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
    </button>
  );
}
