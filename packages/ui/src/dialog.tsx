'use client';

import * as React from 'react';

import { cn } from './cn';

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onClose: () => {},
});

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps): JSX.Element | null {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onClose }}>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl',
        'mx-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h2 className={cn('font-serif text-xl text-brand-ink', className)} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return (
    <p className={cn('mt-1 text-sm text-brand-ink/60', className)} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('mt-6 flex items-center justify-end gap-3', className)} {...props}>
      {children}
    </div>
  );
}

export function useDialog(): { open: boolean; onClose: () => void } {
  return React.useContext(DialogContext);
}
