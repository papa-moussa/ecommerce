import * as React from 'react';

import { cn } from './cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'gold' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-brand-ink/8 text-brand-ink',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  gold: 'bg-brand-gold/10 text-brand-gold',
  outline: 'border border-brand-ink/20 text-brand-ink/70',
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
