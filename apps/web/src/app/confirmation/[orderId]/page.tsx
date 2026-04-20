'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  id: string;
  productName: string;
  variantLabel?: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
}

type Status = 'loading' | 'found' | 'not_found' | 'error';

export default function ConfirmationPage(): JSX.Element {
  const { orderId } = useParams<{ orderId: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    clientApi.orders
      .get(orderId)
      .then((data) => {
        setOrder(data as Order);
        setStatus('found');
      })
      .catch(() => setStatus('not_found'));
  }, [orderId]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-ink" />
      </div>
    );
  }

  if (status !== 'found' || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-2xl text-brand-ink">Commande introuvable</h1>
        <Link href="/compte" className="mt-4 text-sm text-brand-gold hover:underline">
          Voir mes commandes
        </Link>
      </div>
    );
  }

  const isPaid =
    order.status === 'PAID' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED';

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      {isPaid ? (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>
          <h1 className="font-serif text-3xl text-brand-ink">Merci pour votre commande&nbsp;!</h1>
          <p className="mt-3 text-sm text-brand-ink/60">
            Votre commande{' '}
            <span className="font-medium text-brand-ink">#{order.id.slice(-8).toUpperCase()}</span>{' '}
            a bien été confirmée. Un e-mail de confirmation vous a été envoyé.
          </p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>
          <h1 className="font-serif text-3xl text-brand-ink">Paiement en cours…</h1>
          <p className="mt-3 text-sm text-brand-ink/60">
            Votre paiement est en cours de traitement. Vous recevrez un e-mail de confirmation sous
            peu.
          </p>
        </>
      )}

      {/* Order items */}
      <div className="mt-10 rounded-xl border border-brand-ink/10 bg-white p-6 text-left">
        <h2 className="mb-4 font-serif text-lg text-brand-ink">Détail de la commande</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-brand-ink/70">
                {item.productName}
                {item.variantLabel ? ` — ${item.variantLabel}` : ''}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              <span className="font-medium text-brand-ink">{formatPrice(item.totalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-brand-ink/10 pt-4 flex justify-between font-medium text-brand-ink">
          <span>Total payé</span>
          <span>{formatPrice(order.totalCents, order.currency)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/produits"
          className="rounded-full bg-brand-ink px-8 py-3 text-sm font-medium text-brand-ivory transition-colors hover:bg-brand-gold"
        >
          Continuer mes achats
        </Link>
        <Link href="/compte" className="text-xs text-brand-ink/40 hover:text-brand-ink">
          Voir mes commandes
        </Link>
      </div>
    </div>
  );
}
