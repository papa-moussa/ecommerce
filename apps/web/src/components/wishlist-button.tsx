'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';

import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface WishlistButtonProps {
  productId: string;
  initialWishlisted?: boolean;
  className?: string;
  onRemove?: () => void;
}

export function WishlistButton({
  productId,
  initialWishlisted = false,
  className,
  onRemove,
}: WishlistButtonProps): JSX.Element {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [optimisticWishlisted, setOptimistic] = useOptimistic(initialWishlisted);

  const toggle = useCallback(() => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris.');
      return;
    }

    startTransition(async () => {
      const next = !optimisticWishlisted;
      setOptimistic(next);
      try {
        if (next) {
          await clientApi.wishlist.add(productId);
          toast.success('Ajouté aux favoris');
        } else {
          await clientApi.wishlist.remove(productId);
          toast.success('Retiré des favoris');
          onRemove?.();
        }
      } catch {
        setOptimistic(!next);
        toast.error('Une erreur est survenue.');
      }
    });
  }, [user, productId, optimisticWishlisted, setOptimistic, onRemove]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      aria-label={optimisticWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={optimisticWishlisted}
      className={className}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={optimisticWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        className={optimisticWishlisted ? 'text-brand-gold' : 'text-brand-ink/40'}
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
