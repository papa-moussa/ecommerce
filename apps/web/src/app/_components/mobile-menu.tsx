'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAuth } from '@/lib/auth';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-brand-ink/60 backdrop-blur-md"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-[#FCFAF7] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-brand-gold/10">
              <Link href="/" className="font-serif text-xl font-bold text-brand-ink">
                Maison Parfum
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-brand-ink hover:bg-brand-ink/5 rounded-full transition-colors"
                aria-label="Fermer le menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <nav className="space-y-8">
                <div className="space-y-6">
                  <Link
                    href="/produits"
                    className="block text-2xl font-serif text-brand-ink hover:text-brand-gold transition-colors"
                  >
                    Notre Collection
                  </Link>
                  <Link
                    href="/quiz"
                    className="block text-2xl font-serif text-brand-ink hover:text-brand-gold transition-colors"
                  >
                    Quiz Parfum
                  </Link>
                  <Link
                    href="/recherche"
                    className="block text-2xl font-serif text-brand-ink hover:text-brand-gold transition-colors"
                  >
                    Recherche
                  </Link>
                </div>

                <div className="pt-8 border-t border-brand-gold/10 space-y-4">
                  <Link
                    href="/compte/favoris"
                    className="flex items-center gap-4 text-brand-ink/70 hover:text-brand-ink transition-colors"
                  >
                    <Heart size={20} className="text-brand-gold" /> Mes favoris
                  </Link>
                  <Link
                    href="/compte"
                    className="flex items-center gap-4 text-brand-ink/70 hover:text-brand-ink transition-colors"
                  >
                    <User size={20} className="text-brand-gold" /> Mon compte
                  </Link>
                </div>

                <div className="pt-8 border-t border-brand-gold/10">
                  {user ? (
                    <button
                      onClick={() => void logout()}
                      className="w-full rounded-xl border border-brand-ink/10 py-4 text-sm font-bold uppercase tracking-widest text-brand-ink hover:bg-brand-ink hover:text-white transition-all"
                    >
                      Déconnexion
                    </button>
                  ) : (
                    <Link
                      href="/connexion"
                      className="block w-full rounded-xl bg-brand-ink py-4 text-center text-sm font-bold uppercase tracking-widest text-brand-ivory hover:bg-brand-gold transition-all"
                    >
                      Connexion
                    </Link>
                  )}
                </div>
              </nav>
            </div>

            <div className="p-6 border-t border-brand-gold/5 bg-brand-ivory/50">
              <p className="text-center text-[10px] uppercase tracking-widest text-brand-ink/30">
                © {new Date().getFullYear()} Maison Parfum · Paris
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-brand-ink hover:bg-brand-ink/5 rounded-full transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={24} />
      </button>

      {mounted && createPortal(menuContent, document.body)}
    </div>
  );
}
