import * as React from 'react';

import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ noPadding = false, className, children, ...props }: CardProps): JSX.Element {
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
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
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
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('text-sm text-brand-ink/70', className)} {...props}>
      {children}
    </div>
  );
}
