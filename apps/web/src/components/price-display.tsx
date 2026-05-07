'use client';

import { useCurrency } from '@/lib/currency';

interface PriceDisplayProps {
  cents: number;
  className?: string;
}

export function PriceDisplay({ cents, className }: PriceDisplayProps) {
  const { format } = useCurrency();
  return <span className={className}>{format(cents)}</span>;
}
