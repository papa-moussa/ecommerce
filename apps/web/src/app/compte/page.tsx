'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';

interface Order {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  PAID: 'text-green-700 bg-green-50',
  PROCESSING: 'text-blue-700 bg-blue-50',
  SHIPPED: 'text-purple-700 bg-purple-50',
  DELIVERED: 'text-green-700 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
  REFUNDED: 'text-gray-600 bg-gray-50',
};

export default function ComptePage(): JSX.Element | null {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/connexion?redirect=/compte');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    clientApi.orders
      .list()
      .then((data) => setOrders(data as Order[]))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-brand-ink">Mon compte</h1>

      {/* Email verification banner */}
      {!user.emailVerified && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p>
            Votre adresse e-mail n&apos;est pas encore vérifiée. Consultez votre boîte mail ou{' '}
            <button
              onClick={() => {
                clientApi.auth
                  .resendVerification()
                  .then(() => setResendStatus('sent'))
                  .catch(() => setResendStatus('error'));
              }}
              className="font-medium underline hover:no-underline"
            >
              renvoyez l&apos;e-mail de confirmation
            </button>
            .
          </p>
          {resendStatus === 'sent' && (
            <span className="shrink-0 text-green-700">E-mail envoyé ✓</span>
          )}
          {resendStatus === 'error' && (
            <span className="shrink-0 text-red-600">Erreur, réessayez.</span>
          )}
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-xl border border-brand-ink/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg text-brand-ink">Informations personnelles</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Nom</dt>
            <dd className="font-medium text-brand-ink">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Email</dt>
            <dd className="font-medium text-brand-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-brand-ink/5 pb-3">
            <dt className="text-brand-ink/50">Email vérifié</dt>
            <dd className="font-medium text-brand-ink">{user.emailVerified ? '✓ Oui' : 'Non'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-ink/50">Membre depuis</dt>
            <dd className="font-medium text-brand-ink">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Orders */}
      <div className="mt-8 rounded-xl border border-brand-ink/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg text-brand-ink">Mes commandes</h2>

        {ordersLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-brand-ink/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-ink" />
            Chargement…
          </div>
        ) : orders.length === 0 ? (
          <p className="py-4 text-sm text-brand-ink/40">Vous n&apos;avez pas encore de commande.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/confirmation/${order.id}`}
                  className="block rounded-lg border border-brand-ink/10 p-4 transition-colors hover:border-brand-gold"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-brand-ink/40">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm text-brand-ink/70">
                        {order.items
                          .slice(0, 2)
                          .map((i) => `${i.productName}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                          .join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                      <p className="mt-1 text-xs text-brand-ink/40">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] ?? 'text-brand-ink/60 bg-brand-ink/5'}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <p className="mt-2 text-sm font-medium text-brand-ink">
                        {formatPrice(order.totalCents, order.currency)}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => void handleLogout()}
        className="mt-8 text-sm text-brand-ink/40 transition-colors hover:text-brand-ink"
      >
        Se déconnecter
      </button>
    </div>
  );
}
