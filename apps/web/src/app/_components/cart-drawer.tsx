'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const DRAWER_VARIANTS = {
  hidden: { x: '100%' },
  visible: { x: 0 },
};

const TRANSITION = { type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] } as const;

export function CartDrawer() {
  const pathname = usePathname();
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotalCents } = useCartStore();

  if (pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            className="fixed inset-0 z-40 bg-brand-ink/30 backdrop-blur-sm"
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-brand-ivory shadow-2xl"
            variants={DRAWER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={TRANSITION}
            aria-label="Panier"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-6 py-4">
              <h2 className="font-serif text-lg text-brand-ink">
                Panier{items.length > 0 && ` (${items.reduce((s, i) => s + i.quantity, 0)})`}
              </h2>
              <button
                onClick={closeCart}
                className="rounded-full p-1 text-brand-ink/40 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                aria-label="Fermer le panier"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <p className="py-16 text-center text-sm text-brand-ink/40">
                  Votre panier est vide.
                </p>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId ?? 'default'}`}
                      className="flex gap-4"
                    >
                      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-brand-ink/20">
                            —
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-brand-ink/40">
                            {item.brand}
                          </p>
                          <p className="text-sm font-medium text-brand-ink">{item.name}</p>
                          {item.sizeMl && (
                            <p className="text-xs text-brand-ink/50">{item.sizeMl} ml</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.variantId, item.quantity - 1)
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-ink/20 text-xs hover:border-brand-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold"
                              aria-label="Diminuer la quantité"
                            >
                              −
                            </button>
                            <span className="w-4 text-center text-sm" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.variantId, item.quantity + 1)
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-ink/20 text-xs hover:border-brand-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold"
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
                            className="text-xs text-brand-ink/30 hover:text-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                            aria-label={`Retirer ${item.name} du panier`}
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
              <div className="space-y-4 border-t border-brand-ink/10 px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-ink/60">Sous-total</span>
                  <span className="font-medium text-brand-ink">{formatPrice(subtotalCents())}</span>
                </div>
                <p className="text-xs text-brand-ink/40">
                  Livraison calculée au moment du paiement.
                </p>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-full bg-brand-ink py-3 text-center text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                >
                  Passer la commande
                </Link>

                <button
                  onClick={closeCart}
                  className="block w-full text-center text-xs text-brand-ink/40 hover:text-brand-ink focus-visible:outline-none focus-visible:underline"
                >
                  Continuer mes achats
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
