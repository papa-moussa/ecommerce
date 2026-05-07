'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ecommerce/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <AlertCircle className="text-red-500" size={24} />,
      button: 'bg-red-600 hover:bg-red-700 text-white border-none',
      bg: 'bg-red-50',
    },
    warning: {
      icon: <AlertCircle className="text-amber-500" size={24} />,
      button: 'bg-amber-600 hover:bg-amber-700 text-white border-none',
      bg: 'bg-amber-50',
    },
    info: {
      icon: <HelpCircle className="text-brand-gold" size={24} />,
      button: 'bg-brand-ink hover:bg-brand-gold text-brand-ivory border-none',
      bg: 'bg-brand-ivory/50',
    },
  };

  const style = variantStyles[variant];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div
                className={`p-6 ${style.bg} flex items-center gap-4 border-b border-brand-ink/5`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  {style.icon}
                </div>
                <div>
                  <DialogTitle className="text-lg font-serif">{title}</DialogTitle>
                </div>
              </div>

              <div className="p-6">
                <DialogDescription className="text-brand-ink/70 leading-relaxed">
                  {description}
                </DialogDescription>
              </div>

              <DialogFooter className="p-6 bg-brand-ivory/20 border-t border-brand-ink/5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-xl border-brand-ink/10 hover:bg-white"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`rounded-xl px-6 font-bold tracking-wide transition-all ${style.button}`}
                >
                  {isLoading ? 'Action en cours...' : confirmText}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
