'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { clientApi } from './api';
import { useAuth } from './auth';

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const items = await clientApi.wishlist.list();
      setWishlistIds(new Set((items as Array<{ id: string }>).map((i) => i.id)));
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) return;

      const isWishlisted = wishlistIds.has(productId);

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (isWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (isWishlisted) {
          await clientApi.wishlist.remove(productId);
        } else {
          await clientApi.wishlist.add(productId);
        }
      } catch (error) {
        // Rollback on error
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (isWishlisted) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw error;
      }
    },
    [user, wishlistIds],
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
