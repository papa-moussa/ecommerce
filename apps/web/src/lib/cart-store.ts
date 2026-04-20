import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  brand: string;
  imageUrl?: string;
  unitPriceCents: number;
  sizeMl?: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Derived
  totalItems: () => number;
  subtotalCents: () => number;
}

function sameItem(a: CartItem, productId: string, variantId?: string): boolean {
  return a.productId === productId && (a.variantId ?? undefined) === (variantId ?? undefined);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => sameItem(i, item.productId, item.variantId));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameItem(i, item.productId, item.variantId)
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter((i) => !sameItem(i, productId, variantId)),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            sameItem(i, productId, variantId) ? { ...i, quantity } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: () => get().items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    }),
    {
      name: 'maison-parfum-cart',
      // Only persist items, not UI state
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
