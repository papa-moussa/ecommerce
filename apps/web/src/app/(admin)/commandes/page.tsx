'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

interface Order {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
}

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

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.orders
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then((r) => {
        setOrders(r.items as Order[]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusUpdate = async () => {
    if (!actionOrder || !newStatus) return;
    try {
      await adminApi.orders.updateStatus(actionOrder.id, {
        status: newStatus,
        ...(tracking && { trackingNumber: tracking }),
      });
      setSuccess('Statut mis à jour.');
      setActionOrder(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRefund = async () => {
    if (!refundOrder) return;
    try {
      await adminApi.orders.refund(refundOrder.id, {
        ...(refundAmount && { amountCents: Math.round(parseFloat(refundAmount) * 100) }),
      });
      setSuccess('Remboursement initié.');
      setRefundOrder(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue<string>().slice(-8)}</span>
      ),
    },
    {
      header: 'Client',
      cell: ({ row }) => (
        <span>
          {row.original.user.firstName} {row.original.user.lastName}
          <br />
          <span className="text-xs text-gray-400">{row.original.user.email}</span>
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[getValue<string>()] ?? ''}`}
        >
          {getValue<string>()}
        </span>
      ),
    },
    { accessorKey: 'totalCents', header: 'Total', cell: ({ getValue }) => fmt(getValue<number>()) },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('fr-FR'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const o = row.original;
        const nextStatuses = VALID_TRANSITIONS[o.status] ?? [];
        return (
          <div className="flex gap-2">
            {nextStatuses.length > 0 && (
              <button
                onClick={() => {
                  setActionOrder(o);
                  setNewStatus(nextStatuses[0] ?? '');
                  setTracking('');
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Avancer
              </button>
            )}
            {o.status === 'PAID' || o.status === 'DELIVERED' ? (
              <button
                onClick={() => {
                  setRefundOrder(o);
                  setRefundAmount('');
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Rembourser
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const STATUSES = [
    '',
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ];

  return (
    <div>
      <PageHeader title={`Commandes (${total})`} />

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

      <div className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded border ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
          >
            {s || 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : (
        <DataTable columns={columns} data={orders} />
      )}

      {/* Status update modal */}
      {actionOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-semibold">Changer le statut</h2>
            <p className="text-sm text-gray-600">
              Commande <span className="font-mono">{actionOrder.id.slice(-8)}</span>
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {(VALID_TRANSITIONS[actionOrder.status] ?? []).map((s) => (
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
                onClick={() => setActionOrder(null)}
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
      {refundOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-semibold">Rembourser la commande</h2>
            <p className="text-sm text-gray-600">Total : {fmt(refundOrder.totalCents)}</p>
            <input
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Montant (€) — vide = total"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRefundOrder(null)}
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
