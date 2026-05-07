'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth';
import { useWishlist } from '@/lib/wishlist-context';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  onRemove?: () => void;
}

export function WishlistButton({
  productId,
  className,
  onRemove,
}: WishlistButtonProps): JSX.Element {
  const { user } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [isPending, setIsPending] = useState(false);

  const isWishlisted = wishlistIds.has(productId);

  const handleToggle = useCallback(async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris.');
      return;
    }

    setIsPending(true);
    try {
      const wasWishlisted = isWishlisted;
      await toggleWishlist(productId);

      if (wasWishlisted) {
        toast.success('Retiré des favoris');
        onRemove?.();
      } else {
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      toast.error('Une erreur est survenue.');
    } finally {
      setIsPending(false);
    }
  }, [user, productId, isWishlisted, toggleWishlist, onRemove]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={isWishlisted}
      className={className}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        className={isWishlisted ? 'text-brand-gold scale-110' : 'text-brand-ink/40'}
        style={{ transition: 'transform 0.2s ease-out' }}
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
