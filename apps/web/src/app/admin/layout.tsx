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
  const { user, isLoading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSetup2FAPage = pathname === '/admin/setup-2fa';

  useEffect(() => {
    if (isSetup2FAPage) return;
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [user, isLoading, router, isSetup2FAPage]);

  if (isSetup2FAPage) {
    return <div className="min-h-screen bg-notion-bg text-notion-text">{children}</div>;
  }

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-notion-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-notion-textSecondary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-notion-text font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        className="shrink-0 bg-notion-sidebar border-r border-notion-border flex flex-col relative z-50"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-14 h-6 w-6 bg-white border border-notion-border rounded-full flex items-center justify-center text-notion-textSecondary shadow-sm z-10 hover:bg-notion-hover transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Logo Section */}
        <div className={`h-14 flex items-center gap-2 px-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="h-6 w-6 bg-notion-text rounded flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <span className="font-semibold text-sm truncate">Maison Parfum</span>
                <span className="text-[10px] bg-notion-hover text-notion-textSecondary px-1.5 py-0.5 rounded font-medium">
                  Admin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 px-3 custom-scrollbar overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative ${
                  active
                    ? 'bg-notion-hover text-notion-text font-medium'
                    : 'text-notion-textSecondary hover:bg-notion-hover/50 hover:text-notion-text'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? label : ''}
              >
                <Icon
                  size={16}
                  className={
                    active
                      ? 'text-notion-text'
                      : 'text-notion-textSecondary group-hover:text-notion-text transition-colors'
                  }
                />
                {!isCollapsed && <span className="text-sm">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 mt-auto space-y-0.5">
          <Link
            href="/"
            className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ExternalLink size={16} />
            {!isCollapsed && <span className="text-sm">Ouvrir la boutique</span>}
          </Link>
          {/* LOW-01 (Audit-2): logout was a no-op — now actually clears session */}
          <button
            onClick={() => {
              logout()
                .then(() => router.push('/'))
                .catch(() => {});
            }}
            className={`flex w-full items-center gap-3 px-2 py-1.5 rounded-md text-red-500/80 hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-white">
        <div className="flex-1 overflow-auto p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
