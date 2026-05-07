import * as React from 'react';

import { cn } from './cn';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  noPadding?: boolean;
}

export function Card({ noPadding = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-brand-ink/8 bg-white shadow-sm',
        !noPadding && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3 className={cn('font-serif text-lg text-brand-ink', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('text-sm text-brand-ink/70', className)} {...props}>
      {children}
    </div>
  );
}
