'use client';

// Thin re-export of sonner — consumers must have `sonner` in their dependencies.
// Usage: place <Toaster /> once in root layout, call toast() anywhere.
export { Toaster, toast } from 'sonner';
export type { ToasterProps } from 'sonner';
