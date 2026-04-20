'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

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
}

const STATUS_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};
const VALID_TRANSITIONS: Record<string, string[]> = {
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    if (!id) return;
    adminApi.orders
      .get(id)
      .then((d) => setOrder(d as OrderDetail))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;
    try {
      await adminApi.orders.updateStatus(order.id, {
        status: newStatus,
        ...(tracking && { trackingNumber: tracking }),
      });
      setSuccess('Statut mis à jour.');
      setShowStatusModal(false);
      const d = await adminApi.orders.get(order.id);
      setOrder(d as OrderDetail);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    try {
      await adminApi.orders.refund(order.id, {
        ...(refundAmount && { amountCents: Math.round(parseFloat(refundAmount) * 100) }),
      });
      setSuccess('Remboursement initié.');
      setShowRefundModal(false);
      const d = await adminApi.orders.get(order.id);
      setOrder(d as OrderDetail);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) return <div className="text-gray-400">Chargement…</div>;
  if (error && !order) return <div className="text-red-600">{error}</div>;
  if (!order) return null;

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const addr = order.shippingAddress;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Retour
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              Commande <span className="font-mono">#{order.id.slice(-8).toUpperCase()}</span>
            </h1>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? ''}`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Créée le {new Date(order.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          {nextStatuses.length > 0 && (
            <button
              onClick={() => {
                setNewStatus(nextStatuses[0] ?? '');
                setTracking('');
                setShowStatusModal(true);
              }}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Avancer le statut
            </button>
          )}
          {(order.status === 'PAID' || order.status === 'DELIVERED') && (
            <button
              onClick={() => {
                setRefundAmount('');
                setShowRefundModal(true);
              }}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Rembourser
            </button>
          )}
        </div>
      </div>

      {(error || success) && (
        <div
          className={`mb-4 px-4 py-3 rounded text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
        >
          {error || success}
          <button
            className="ml-2 underline"
            onClick={() => {
              setError('');
              setSuccess('');
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Status timeline */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Progression</h2>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      i < stepIndex
                        ? 'bg-green-500 border-green-500 text-white'
                        : i === stepIndex
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'bg-white border-gray-200 text-gray-300'
                    }`}
                  >
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span
                    className={`mt-1 text-[10px] whitespace-nowrap ${i <= stepIndex ? 'text-gray-700' : 'text-gray-300'}`}
                  >
                    {s}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="mt-4 text-sm text-gray-600">
              Numéro de suivi :{' '}
              <span className="font-mono font-medium">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Customer */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Client</h2>
          <p className="font-medium text-sm">
            {order.user.firstName} {order.user.lastName}
          </p>
          <p className="text-xs text-gray-400">{order.user.email}</p>
        </div>

        {/* Shipping address */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Livraison</h2>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>{addr.line1}</p>
            {addr.line2 && <p>{addr.line2}</p>}
            <p>
              {addr.postalCode} {addr.city}
            </p>
            <p>{addr.country}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Paiement</h2>
          {order.payments.map((p) => (
            <div key={p.id} className="text-sm">
              <span
                className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${p.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
              >
                {p.status}
              </span>
              <p className="mt-1 font-medium">{fmt(p.amountCents, p.currency)}</p>
              {p.paidAt && (
                <p className="text-xs text-gray-400">
                  {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                </p>
              )}
              {p.stripePaymentIntentId && (
                <p className="text-xs font-mono text-gray-300 truncate">
                  {p.stripePaymentIntentId}
                </p>
              )}
            </div>
          ))}
          {order.payments.length === 0 && <p className="text-xs text-gray-400">Aucun paiement.</p>}
        </div>
      </div>

      {/* Order items */}
      <div className="rounded-lg border border-gray-200 bg-white mb-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Articles</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="px-5 py-2.5 text-left">Produit</th>
              <th className="px-5 py-2.5 text-right">PU</th>
              <th className="px-5 py-2.5 text-right">Qté</th>
              <th className="px-5 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <p className="font-medium">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-gray-400">{item.variantLabel}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-right">{fmt(item.unitPriceCents)}</td>
                <td className="px-5 py-3 text-right">{item.quantity}</td>
                <td className="px-5 py-3 text-right font-medium">{fmt(item.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="space-y-1.5 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total</span>
            <span>{fmt(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Réduction {order.promoCode && `(${order.promoCode})`}</span>
              <span>−{fmt(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Livraison</span>
            <span>{fmt(order.shippingCents)}</span>
          </div>
          {order.taxCents > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA</span>
              <span>{fmt(order.taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
            <span>Total</span>
            <span>{fmt(order.totalCents)}</span>
          </div>
        </div>
        {order.giftMessage && (
          <div className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
            <span className="font-medium">Message cadeau :</span> {order.giftMessage}
          </div>
        )}
      </div>

      {/* Status modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-semibold">Changer le statut</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {newStatus === 'SHIPPED' && (
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Numéro de suivi (requis)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-semibold">Rembourser</h2>
            <p className="text-sm text-gray-500">
              Laissez vide pour un remboursement total ({fmt(order.totalCents)}).
            </p>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Montant en € (optionnel)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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
