'use client';

import { ArrowLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';
import { fmtAdmin } from '@/lib/admin-currency';

interface OrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
}

interface Payment {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
}

interface OrderDetail {
  id: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  promoCode: string | null;
  giftMessage: string | null;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  user: { id: string; email: string; firstName: string; lastName: string };
  items: OrderItem[];
  payments: Payment[];
  paymentMethod: 'ONLINE' | 'CASH_ON_DELIVERY';
}

const STEPS_ADMIN = ['VALIDATION', 'PREPARATION', 'LIVRAISON', 'TERMINE'];
const STEP_MAPPING: Record<string, string> = {
  PENDING_CONFIRMATION: 'VALIDATION',
  PENDING: 'VALIDATION',
  CONFIRMED: 'VALIDATION',
  PAID: 'PREPARATION',
  PROCESSING: 'PREPARATION',
  SHIPPED: 'LIVRAISON',
  DELIVERED: 'TERMINE',
};
const STATUS_LABELS_PHASE: Record<string, string> = {
  VALIDATION: 'Validation',
  PREPARATION: 'Préparation',
  LIVRAISON: 'Expédition',
  TERMINE: 'Livrée',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'À confirmer',
  CONFIRMED: 'Confirmée',
  PENDING: 'Attente',
  PAID: 'Payé',
  PROCESSING: 'En cours',
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-orange-50 text-orange-700 border-orange-100',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  PAID: 'bg-blue-50 text-blue-700 border-blue-100',
  PROCESSING: 'bg-purple-50 text-purple-700 border-purple-100',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-700 border-red-100',
  REFUNDED: 'bg-brand-ink/5 text-brand-ink/50 border-brand-ink/10',
};
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_CONFIRMATION: ['PROCESSING', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PENDING: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const refresh = async () => {
    if (!id) return;
    const d = await adminApi.orders.get(id);
    setOrder(d as OrderDetail);
  };

  useEffect(() => {
    if (!id) return;
    adminApi.orders
      .get(id)
      .then((d) => setOrder(d as OrderDetail))
      .catch((e: Error) => toast.error('Erreur', { description: e.message }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;
    try {
      await adminApi.orders.updateStatus(order.id, {
        status: newStatus,
        ...(tracking && { trackingNumber: tracking }),
      });
      toast.success('Statut mis à jour');
      setShowStatusModal(false);
      await refresh();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    try {
      await adminApi.orders.refund(order.id, {
        ...(refundAmount && { amountCents: Math.round(parseFloat(refundAmount) * 100) }),
      });
      toast.success('Remboursement initié');
      setShowRefundModal(false);
      await refresh();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      </div>
    );
  }
  if (!order) return null;

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
  const currentPhase = STEP_MAPPING[order.status] || 'VALIDATION';
  const stepIndex = STEPS_ADMIN.indexOf(currentPhase);
  const addr = order.shippingAddress;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-brand-ink/[0.06]">
        <button
          onClick={() => router.back()}
          className="p-2 text-brand-ink/30 hover:text-brand-ink hover:bg-brand-ivory/60 rounded-xl transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-serif font-bold text-brand-ink">
              Commande{' '}
              <span className="font-mono text-xl">#{order.id.slice(-8).toUpperCase()}</span>
            </h1>
            <span className={`admin-badge ${STATUS_COLORS[order.status] ?? ''}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="text-sm text-brand-ink/40 mt-0.5 font-medium">
            Créée le {new Date(order.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {nextStatuses.length > 0 && (
            <button
              onClick={() => {
                // Shortcut: if COD and pending confirmation, suggest PROCESSING
                const defaultNext =
                  order.status === 'PENDING_CONFIRMATION' && nextStatuses.includes('PROCESSING')
                    ? 'PROCESSING'
                    : nextStatuses[0];
                setNewStatus(defaultNext ?? '');
                setTracking('');
                setShowStatusModal(true);
              }}
              className="admin-btn-primary"
            >
              <ChevronRight size={14} />
              {order.status === 'PENDING_CONFIRMATION' ? 'Confirmer et Préparer' : 'Étape suivante'}
            </button>
          )}
          {(order.status === 'PAID' || order.status === 'DELIVERED') && (
            <button
              onClick={() => {
                setRefundAmount('');
                setShowRefundModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
            >
              <RotateCcw size={14} />
              Rembourser
            </button>
          )}
        </div>
      </div>

      {/* Status timeline */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <div className="admin-card p-6">
          <p className="admin-section-title mb-5">Progression</p>
          <div className="flex items-center">
            {STEPS_ADMIN.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      i < stepIndex
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : i === stepIndex
                          ? 'bg-brand-ink border-brand-ink text-brand-ivory'
                          : 'bg-white border-brand-ink/10 text-brand-ink/20'
                    }`}
                  >
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span
                    className={`mt-2 text-[10px] uppercase tracking-wide font-bold whitespace-nowrap ${
                      i <= stepIndex ? 'text-brand-ink/60' : 'text-brand-ink/20'
                    }`}
                  >
                    {STATUS_LABELS_PHASE[s] ?? s}
                  </span>
                </div>
                {i < STEPS_ADMIN.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full ${
                      i < stepIndex ? 'bg-emerald-400' : 'bg-brand-ink/[0.06]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="mt-5 text-sm text-brand-ink/60 font-medium border-t border-brand-ink/[0.06] pt-4">
              Suivi :{' '}
              <span className="font-mono font-bold text-brand-ink">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <p className="admin-label mb-3">Client</p>
          <p className="font-bold text-brand-ink text-sm">
            {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Client Invité'}
          </p>
          <p className="text-xs text-brand-ink/40 mt-0.5 font-medium">
            {order.user?.email || "Pas d'email"}
          </p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-label mb-3">Livraison</p>
          <div className="text-sm text-brand-ink/70 space-y-0.5">
            <p className="font-medium text-brand-ink">{addr.line1}</p>
            {addr.line2 && <p>{addr.line2}</p>}
            <p>
              {addr.postalCode} {addr.city}
            </p>
            <p>{addr.country}</p>
          </div>
        </div>
        <div className="admin-card p-5">
          <p className="admin-label mb-3">Paiement</p>
          {order.payments.map((p) => (
            <div key={p.id} className="text-sm space-y-1">
              <span
                className={`admin-badge ${
                  p.status === 'SUCCEEDED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-brand-ink/5 text-brand-ink/50 border-brand-ink/10'
                }`}
              >
                {p.status}
              </span>
              <p className="font-bold text-brand-ink mt-1">
                {fmtAdmin(p.amountCents, p.currency as 'EUR' | 'XOF')}
              </p>
              {p.paidAt && (
                <p className="text-xs text-brand-ink/40 tabular-nums">
                  {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                </p>
              )}
              {p.stripePaymentIntentId && (
                <p className="text-xs font-mono text-brand-ink/20 truncate">
                  {p.stripePaymentIntentId}
                </p>
              )}
            </div>
          ))}
          {order.payments.length === 0 && (
            <p className="text-xs text-brand-ink/30 italic">Aucun paiement.</p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-ink/[0.06]">
          <p className="admin-section-title">Articles</p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-brand-ink/[0.06] bg-brand-ivory/30">
            <tr>
              <th className="px-6 py-3.5 text-left admin-label">Produit</th>
              <th className="px-6 py-3.5 text-right admin-label">PU</th>
              <th className="px-6 py-3.5 text-right admin-label">Qté</th>
              <th className="px-6 py-3.5 text-right admin-label">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-ink/[0.04]">
            {order.items.map((item) => (
              <tr key={item.id} className="hover:bg-brand-gold/[0.03] transition-colors">
                <td className="px-6 py-3.5">
                  <p className="font-medium text-brand-ink">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-brand-ink/40 font-medium">{item.variantLabel}</p>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right text-brand-ink/60 tabular-nums">
                  {fmtAdmin(item.unitPriceCents)}
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-brand-ink tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-brand-ink tabular-nums">
                  {fmtAdmin(item.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="admin-card p-6">
        <div className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-brand-ink/60">
            <span>Sous-total</span>
            <span className="tabular-nums">{fmtAdmin(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Réduction {order.promoCode && `(${order.promoCode})`}</span>
              <span className="tabular-nums">−{fmtAdmin(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-brand-ink/60">
            <span>Livraison</span>
            <span className="tabular-nums">{fmtAdmin(order.shippingCents)}</span>
          </div>
          {order.taxCents > 0 && (
            <div className="flex justify-between text-brand-ink/60">
              <span>TVA</span>
              <span className="tabular-nums">{fmtAdmin(order.taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-brand-ink border-t border-brand-ink/[0.06] pt-2 mt-1">
            <span>Total</span>
            <span className="tabular-nums font-serif">{fmtAdmin(order.totalCents)}</span>
          </div>
        </div>
        {order.giftMessage && (
          <div className="mt-4 text-sm text-brand-ink/60 border-t border-brand-ink/[0.06] pt-4">
            <span className="font-bold text-brand-ink">Message cadeau :</span> {order.giftMessage}
          </div>
        )}
      </div>

      {/* Status modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 space-y-6">
            <div>
              <h2 className="text-xl font-serif text-brand-ink">Mise à jour statut</h2>
              <p className="text-xs text-brand-ink/40 font-medium mt-1">
                Commande #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="admin-label ml-1">Nouveau statut</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="admin-select"
                >
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] ?? s}
                    </option>
                  ))}
                </select>
              </div>
              {newStatus === 'SHIPPED' && (
                <div className="space-y-1.5">
                  <label className="admin-label ml-1">Numéro de suivi</label>
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Ex: DHL-123456"
                    className="admin-input"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowStatusModal(false)} className="admin-btn-ghost">
                Annuler
              </button>
              <button onClick={handleStatusUpdate} className="admin-btn-primary">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 space-y-6">
            <div>
              <h2 className="text-xl font-serif text-brand-ink">Remboursement</h2>
              <p className="text-xs text-brand-ink/40 mt-1 font-medium">
                Total : {fmtAdmin(order.totalCents)}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="admin-label ml-1">
                Montant à rembourser (laisser vide pour tout)
              </label>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Optionnel — total si vide"
                className="admin-input"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRefundModal(false)} className="admin-btn-ghost">
                Annuler
              </button>
              <button
                onClick={handleRefund}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-95"
              >
                Rembourser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
