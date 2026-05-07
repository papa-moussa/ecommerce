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
  REFUNDED: 'bg-brand-ink/5 text-brand-ink/50',
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
          <span className="font-bold text-brand-ink">
            #{row.original.id.slice(-8).toUpperCase()}
          </span>
          <span className="text-[10px] text-brand-ink/40 font-medium">
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
          <div className="h-8 w-8 rounded-full bg-brand-ivory flex items-center justify-center border border-brand-ink/5">
            <span className="text-[10px] font-bold text-brand-gold">
              {row.original.user.firstName[0]}
              {row.original.user.lastName[0]}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-brand-ink text-xs">
              {row.original.user.firstName} {row.original.user.lastName}
            </span>
            <span className="text-[10px] text-brand-ink/40 font-medium">
              {row.original.user.email}
            </span>
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[status] ?? ''} border opacity-80`}
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
        <span className="font-bold text-brand-ink">{fmtAdmin(getValue<number>())}</span>
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
      <div className="flex items-center gap-1 bg-brand-ivory/30 p-1 rounded-xl border border-brand-ink/5 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStatusFilter(s.id);
              setPage(1);
            }}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
              statusFilter === s.id
                ? 'bg-brand-ink text-brand-ivory shadow-lg shadow-brand-ink/20'
                : 'text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ivory'
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
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 space-y-6">
            <div>
              <h2 className="text-xl font-serif text-brand-ink">Mise à jour statut</h2>
              <p className="text-xs text-brand-ink/40 font-medium">
                Commande #{actionOrder.id.slice(-8).toUpperCase()}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                  Nouveau statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border-brand-ink/5 bg-brand-ivory/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none"
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
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                    Numéro de suivi
                  </label>
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Ex: DHL-123456"
                    className="w-full border-brand-ink/5 bg-brand-ivory/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionOrder(null)}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-ink/40"
              >
                Annuler
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold transition-all shadow-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundOrder && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 space-y-6">
            <div>
              <h2 className="text-xl font-serif text-brand-ink">Remboursement</h2>
              <p className="text-xs text-brand-ink/40 font-medium">
                Total de la commande : {fmtAdmin(refundOrder.totalCents)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                Montant à rembourser (FCFA)
              </label>
              <input
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                type="number"
                placeholder="Laisser vide pour total"
                className="w-full border-brand-ink/5 bg-brand-ivory/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRefundOrder(null)}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-ink/40"
              >
                Annuler
              </button>
              <button
                onClick={handleRefund}
                className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg"
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
