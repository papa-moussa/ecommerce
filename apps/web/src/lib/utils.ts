import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number, currency = 'XOF'): string {
  const isXof = currency === 'XOF';
  return new Intl.NumberFormat(isXof ? 'fr-SN' : 'fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: isXof ? 0 : 2,
    maximumFractionDigits: isXof ? 0 : 2,
  }).format(isXof ? value : value / 100);
}
