import * as React from 'react';

import { cn } from './cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium uppercase tracking-wider text-brand-ink/60"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-sm text-brand-ink',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-1',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-brand-ink/15 hover:border-brand-ink/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-ink/40"
          >
            ▾
          </span>
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
