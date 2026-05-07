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
  maxStock?: number;
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
  maxStock = 99,
}: AddToCartButtonProps) {
  const { addItem, items } = useCartStore();
  const [added, setAdded] = useState(false);

  const existingItem = items.find(
    (i) => i.productId === productId && i.variantId === selectedVariantId,
  );
  const currentQtyInCart = existingItem?.quantity || 0;

  const outOfStock = stockStatus === 'OUT_OF_STOCK' || currentQtyInCart >= maxStock;

  function handleClick() {
    if (currentQtyInCart >= maxStock) return;

    addItem({
      productId,
      variantId: selectedVariantId,
      name,
      brand,
      imageUrl,
      unitPriceCents,
      sizeMl: selectedSizeMl,
      stock: maxStock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={outOfStock}
      className="w-full rounded-full bg-brand-ink py-4 font-medium text-brand-ivory transition-all hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
    >
      {stockStatus === 'OUT_OF_STOCK'
        ? 'Épuisé'
        : currentQtyInCart >= maxStock
          ? 'Limite de stock atteinte'
          : added
            ? '✓ Ajouté au panier'
            : 'Ajouter au panier'}
    </button>
  );
}
