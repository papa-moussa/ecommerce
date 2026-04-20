'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const pathname = usePathname();
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotalCents } = useCartStore();

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={closeCart} aria-hidden="true" />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-brand-ivory shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Panier"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-ink/10 px-6 py-4">
          <h2 className="font-serif text-lg text-brand-ink">
            Panier{items.length > 0 && ` (${items.reduce((s, i) => s + i.quantity, 0)})`}
          </h2>
          <button
            onClick={closeCart}
            className="text-brand-ink/40 transition-colors hover:text-brand-ink"
            aria-label="Fermer le panier"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-ink/40">Votre panier est vide.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId ?? 'default'}`} className="flex gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-white text-brand-ink/20 text-xs">
                      —
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-ink/40">
                        {item.brand}
                      </p>
                      <p className="text-sm font-medium text-brand-ink">{item.name}</p>
                      {item.sizeMl && <p className="text-xs text-brand-ink/50">{item.sizeMl} ml</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-ink/20 text-xs hover:border-brand-gold"
                          aria-label="Diminuer la quantité"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-ink/20 text-xs hover:border-brand-gold"
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-medium text-brand-ink">
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </p>

                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-xs text-brand-ink/30 hover:text-red-500"
                        aria-label="Retirer du panier"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-ink/10 px-6 py-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-brand-ink/60">Sous-total</span>
              <span className="font-medium text-brand-ink">{formatPrice(subtotalCents())}</span>
            </div>
            <p className="text-xs text-brand-ink/40">Livraison calculée au moment du paiement.</p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full rounded-full bg-brand-ink py-3 text-center text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold"
            >
              Passer la commande
            </Link>

            <button
              onClick={closeCart}
              className="block w-full text-center text-xs text-brand-ink/40 hover:text-brand-ink"
            >
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  );
}
