import * as React from 'react';

import { cn } from '@/lib/utils';

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }
>(({ className, variant = 'primary', ...props }, ref) => {
  const variants = {
    primary: 'bg-brand-ink text-brand-ivory hover:bg-brand-gold',
    outline: 'border border-brand-gold text-brand-ink hover:bg-brand-gold hover:text-brand-ivory',
    ghost: 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-gold/10',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
