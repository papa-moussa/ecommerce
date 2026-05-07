import * as React from 'react';

import { cn } from './cn';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, width, height, style }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-brand-ink/8', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
};

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}
