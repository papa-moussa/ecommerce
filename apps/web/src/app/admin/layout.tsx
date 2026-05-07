'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  ScrollText,
  ShoppingCart,
  Ticket,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produits', label: 'Produits', icon: Package },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/reviews', label: 'Avis', icon: MessageSquare },
  { href: '/admin/promo-codes', label: 'Codes Promo', icon: Ticket },
  { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
  { href: '/admin/email-logs', label: 'E-mails', icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // setup-2fa est accessible sans session : l'utilisateur navigue avec un tempToken uniquement
  const isSetup2FAPage = pathname === '/admin/setup-2fa';

  useEffect(() => {
    if (isSetup2FAPage) return;
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [user, isLoading, router, isSetup2FAPage]);

  // Rendre la page setup-2fa sans le layout admin (pas de sidebar)
  if (isSetup2FAPage) {
    return <div className="min-h-screen bg-brand-ivory">{children}</div>;
  }

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory/20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-ivory/10">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="shrink-0 bg-brand-ink text-brand-ivory flex flex-col relative z-50 shadow-2xl overflow-hidden"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 h-6 w-6 bg-brand-gold rounded-full flex items-center justify-center text-brand-ink shadow-lg z-10 hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section */}
        <div
          className={`p-6 border-b border-white/5 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="h-8 w-8 bg-brand-gold rounded-lg flex items-center justify-center shrink-0">
            <span className="text-brand-ink font-bold font-serif">M</span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <p className="text-white font-serif font-bold text-sm tracking-wide">
                  Maison Parfum
                </p>
                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.2em] opacity-60 leading-none">
                  Console
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 px-3 custom-scrollbar overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-brand-gold text-brand-ink font-bold'
                    : 'text-brand-ivory/40 hover:bg-white/5 hover:text-brand-ivory'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? label : ''}
              >
                <Icon
                  size={20}
                  className={
                    active
                      ? 'text-brand-ink'
                      : 'text-brand-ivory/20 group-hover:text-brand-gold transition-colors'
                  }
                />
                {!isCollapsed && <span className="text-xs tracking-wide">{label}</span>}
                {active && !isCollapsed && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-brand-ink rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-brand-ivory/40 hover:bg-white/5 hover:text-brand-ivory transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ExternalLink size={18} />
            {!isCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-widest">Boutique</span>
            )}
          </Link>
          <button
            onClick={() => {
              /* handle logout */
            }}
            className={`flex w-full items-center gap-3 px-3 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-widest">Déconnexion</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <div className="flex-1 overflow-auto p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
