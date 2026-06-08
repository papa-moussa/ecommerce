'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { ChevronRight, Info, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';
import { fmtAdmin } from '@/lib/admin-currency';

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
  REFUNDED: 'bg-notion-hover text-notion-textSecondary',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState('');

  const load = useCallback(
    async (currentPage = page, currentLimit = limit, filter = statusFilter) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: currentLimit.toString(),
        };
        if (filter) params.status = filter;

        const r = await adminApi.orders.list(params);
        setOrders(r.items as Order[]);
        setTotal(r.total);
        setPageCount(r.pages);
      } catch (e) {
        toast.error('Erreur de chargement', { description: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [page, limit, statusFilter],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusUpdate = async () => {
    if (!actionOrder || !newStatus) return;
    try {
      await adminApi.orders.updateStatus(actionOrder.id, {
        status: newStatus,
        ...(tracking && { trackingNumber: tracking }),
      });
      toast.success('Statut mis à jour');
      setActionOrder(null);
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  const handleRefund = async () => {
    if (!refundOrder) return;
    try {
      await adminApi.orders.refund(refundOrder.id, {
        ...(refundAmount && { amountCents: Math.round(parseFloat(refundAmount) * 100) }),
      });
      toast.success('Remboursement initié');
      setRefundOrder(null);
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'id',
      header: 'Commande',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-notion-text">
            #{row.original.id.slice(-8).toUpperCase()}
          </span>
          <span className="text-xs text-notion-textSecondary">
            {new Date(row.original.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Client',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-notion-hover flex items-center justify-center border border-notion-border">
            <span className="text-xs font-medium text-notion-textSecondary">
              {row.original.user.firstName[0]}
              {row.original.user.lastName[0]}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-notion-text text-sm">
              {row.original.user.firstName} {row.original.user.lastName}
            </span>
            <span className="text-xs text-notion-textSecondary">{row.original.user.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium tracking-wide ${STATUS_COLORS[status] ?? ''}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalCents',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="font-medium text-notion-text">{fmtAdmin(getValue<number>())}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const o = row.original;
        const nextStatuses = VALID_TRANSITIONS[o.status] ?? [];
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/commandes/${o.id}`}
              className="p-2 text-brand-ink/40 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all"
              title="Détails"
            >
              <Info size={16} />
            </Link>
            {nextStatuses.length > 0 && (
              <button
                onClick={() => {
                  setActionOrder(o);
                  setNewStatus(nextStatuses[0] ?? '');
                  setTracking('');
                }}
                className="p-2 text-brand-ink/40 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all"
                title="Avancer le statut"
              >
                <ChevronRight size={16} />
              </button>
            )}
            {(o.status === 'PAID' || o.status === 'DELIVERED') && (
              <button
                onClick={() => {
                  setRefundOrder(o);
                  setRefundAmount('');
                }}
                className="p-2 text-brand-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Rembourser"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const STATUSES = [
    { id: '', label: 'Tous' },
    { id: 'PENDING', label: 'Attente' },
    { id: 'PAID', label: 'Payé' },
    { id: 'PROCESSING', label: 'En cours' },
    { id: 'SHIPPED', label: 'Expédié' },
    { id: 'DELIVERED', label: 'Livré' },
    { id: 'CANCELLED', label: 'Annulé' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Commandes (${total})`} />

      {/* Premium Status Tabs */}
      <div className="flex items-center gap-1 bg-notion-hover/50 p-1 rounded-md border border-notion-border w-fit">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStatusFilter(s.id);
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              statusFilter === s.id
                ? 'bg-white text-notion-text shadow-sm border border-notion-border/50'
                : 'text-notion-textSecondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={loading}
        pageCount={pageCount}
        pageIndex={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      {/* Status update modal */}
      {actionOrder && (
        <div className="fixed inset-0 bg-notion-text/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-notion-border space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-notion-text">Mise à jour statut</h2>
              <p className="text-sm text-notion-textSecondary">
                Commande #{actionOrder.id.slice(-8).toUpperCase()}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-notion-textSecondary ml-1">
                  Nouveau statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-notion-border bg-transparent rounded-md px-3 py-2 text-sm focus:border-notion-textSecondary outline-none appearance-none hover:bg-notion-hover/50"
                >
                  {(VALID_TRANSITIONS[actionOrder.status] ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === 'SHIPPED' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-notion-textSecondary ml-1">
                    Numéro de suivi
                  </label>
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Ex: DHL-123456"
                    className="w-full border border-notion-border bg-transparent rounded-md px-3 py-2 text-sm focus:border-notion-textSecondary outline-none placeholder:text-notion-textSecondary/50 hover:bg-notion-hover/50"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setActionOrder(null)}
                className="px-4 py-2 text-sm font-medium text-notion-textSecondary hover:bg-notion-hover rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm font-medium bg-notion-text text-white rounded-md hover:bg-notion-text/90 transition-colors shadow-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundOrder && (
        <div className="fixed inset-0 bg-notion-text/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-notion-border space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-notion-text">Remboursement</h2>
              <p className="text-sm text-notion-textSecondary">
                Total : {fmtAdmin(refundOrder.totalCents)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-notion-textSecondary ml-1">
                Montant à rembourser (FCFA)
              </label>
              <input
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                type="number"
                placeholder="Laisser vide pour total"
                className="w-full border border-notion-border bg-transparent rounded-md px-3 py-2 text-sm focus:border-notion-textSecondary outline-none placeholder:text-notion-textSecondary/50 hover:bg-notion-hover/50"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRefundOrder(null)}
                className="px-4 py-2 text-sm font-medium text-notion-textSecondary hover:bg-notion-hover rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
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
