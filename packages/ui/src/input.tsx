import * as React from 'react';

import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-brand-ink/60"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-brand-ink',
            'placeholder:text-brand-ink/30',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-1',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-brand-ink/15 hover:border-brand-ink/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-brand-ink/40">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
