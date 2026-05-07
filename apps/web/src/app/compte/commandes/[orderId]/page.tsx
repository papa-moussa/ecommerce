'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ExternalLink, MapPin, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clientApi } from '@/lib/api';
import { useCurrency } from '@/lib/currency';

import { OrderTimeline } from '../_components/timeline';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantLabel?: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  product: {
    slug: string;
  };
}

interface Order {
  id: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  promoCode?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  createdAt: string;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { format: formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    clientApi.orders
      .get(orderId)
      .then((data) => {
        setOrder(data as Order);
      })
      .catch(() => {
        // En cas d'erreur ou si non trouvé, on peut rediriger
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <h1 className="font-playfair text-2xl text-brand-ink">Commande introuvable</h1>
        <Link href="/compte" className="mt-4 text-sm text-brand-gold hover:underline">
          Retour à mes commandes
        </Link>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    PENDING_CONFIRMATION: 'À confirmer',
    CONFIRMED: 'Confirmée',
    PENDING: 'En attente de paiement',
    PAID: 'Payée',
    PROCESSING: 'En préparation',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
  };

  const shipping = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/compte"
        className="inline-flex items-center gap-2 text-sm text-brand-ink/40 hover:text-brand-ink transition-colors mb-8"
      >
        <ChevronLeft size={16} />
        Retour à mes commandes
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-brand-ink mb-2">
            Commande #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-brand-ink/60">
            Passée le {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold uppercase tracking-widest">
            {statusLabels[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white rounded-[2rem] border border-brand-ink/5 shadow-sm p-8 mb-8">
        <h2 className="text-xl font-playfair font-semibold text-brand-ink mb-6 flex items-center gap-2">
          <Truck size={20} className="text-brand-gold" />
          Statut de livraison
        </h2>
        <OrderTimeline status={order.status} />

        {order.trackingNumber && (
          <div className="mt-8 p-6 bg-brand-ivory/50 rounded-2xl border border-brand-gold/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-ink/40 uppercase tracking-widest font-bold mb-1">
                Numéro de suivi
              </p>
              <p className="font-mono text-lg text-brand-ink">{order.trackingNumber}</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-2 bg-brand-ink text-white rounded-full text-sm font-medium hover:bg-brand-gold transition-colors">
              Suivre sur le site du transporteur
              <ExternalLink size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-brand-ink/5 shadow-sm p-8">
            <h2 className="text-xl font-playfair font-semibold text-brand-ink mb-6 flex items-center gap-2">
              <Package size={20} className="text-brand-gold" />
              Articles commandés
            </h2>
            <div className="divide-y divide-brand-ink/5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-ink/5 last:border-0"
                >
                  <div className="flex-1">
                    <Link
                      href={`/produits/${item.product.slug}`}
                      className="font-medium text-brand-ink hover:text-brand-gold transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-brand-ink/40">
                      {item.variantLabel || 'Format standard'} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <p className="font-semibold text-brand-ink">{formatPrice(item.totalCents)}</p>

                    {order.status === 'DELIVERED' && (
                      <Link
                        href={`/produits/${item.product.slug}#reviews`}
                        className="px-4 py-2 bg-brand-ivory text-brand-ink border border-brand-ink/10 rounded-full text-xs font-bold hover:bg-brand-ink hover:text-white transition-all uppercase tracking-widest"
                      >
                        Laisser un avis
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-brand-ink/10 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <p className="text-brand-ink/60">Sous-total</p>
                <p className="text-brand-ink font-medium">{formatPrice(order.subtotalCents)}</p>
              </div>

              {order.discountCents > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <p className="flex items-center gap-1.5">
                    Réduction{' '}
                    {order.promoCode && (
                      <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded font-bold">
                        {order.promoCode}
                      </span>
                    )}
                  </p>
                  <p>- {formatPrice(order.discountCents)}</p>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <p className="text-brand-ink/60">Livraison</p>
                <p className="text-brand-ink font-medium">
                  {order.shippingCents === 0 ? 'Gratuite' : formatPrice(order.shippingCents)}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t border-brand-ink/5">
                <p className="text-lg font-playfair font-bold text-brand-ink">Total</p>
                <p className="text-2xl font-playfair font-bold text-brand-gold">
                  {formatPrice(order.totalCents)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Shipping Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-brand-ink/5 shadow-sm p-8">
            <h2 className="text-xl font-playfair font-semibold text-brand-ink mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-brand-gold" />
              Livraison
            </h2>
            <div className="text-sm text-brand-ink/70 space-y-1">
              <p className="font-bold text-brand-ink mb-2">
                {shipping?.firstName} {shipping?.lastName}
              </p>
              <p>{shipping?.address}</p>
              <p>
                {shipping?.postalCode} {shipping?.city}
              </p>
              <p>{shipping?.country}</p>
              {shipping?.phone && (
                <p className="mt-4 pt-4 border-t border-brand-ink/5 text-xs">
                  <span className="text-brand-ink/40 uppercase font-bold mr-2">Contact:</span>
                  {shipping.phone}
                </p>
              )}
            </div>
          </div>

          <div className="bg-brand-ink text-brand-ivory rounded-[2rem] p-8 text-center">
            <p className="text-sm mb-4">Besoin d'aide avec votre commande ?</p>
            <button className="w-full py-3 bg-brand-gold text-white rounded-full text-sm font-bold hover:bg-white hover:text-brand-gold transition-all">
              Contacter le support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
