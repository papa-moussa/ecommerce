'use client';

import { type PromoCode } from '@ecommerce/shared-types';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, MoreHorizontal, Plus, Ticket, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';

import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    code: string;
    isActive: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.promoCodes.list({
        page: page.toString(),
        limit: limit.toString(),
      });
      setPromoCodes(res.items);
      setTotal(res.total);
      setPageCount(res.pages);
    } catch (e) {
      toast.error('Erreur de chargement', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      await adminApi.promoCodes.update(confirmTarget.id, { isActive: !confirmTarget.isActive });
      toast.success(confirmTarget.isActive ? 'Code désactivé' : 'Code activé');
      setConfirmTarget(null);
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: ColumnDef<PromoCode>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
            <Ticket size={20} />
          </div>
          <div>
            <p className="font-bold text-brand-ink uppercase tracking-wider">{row.original.code}</p>
            <p className="text-[10px] text-brand-ink/40 font-medium italic">
              Créé le {new Date(row.original.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-brand-ink/60 bg-brand-ivory/50 px-2.5 py-1 rounded-lg border border-brand-ink/5">
          {getValue<string>() === 'PERCENTAGE' ? 'Pourcentage' : 'Montant Fixe'}
        </span>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Valeur',
      cell: ({ row }) => (
        <span className="font-serif text-lg font-bold text-brand-ink">
          {row.original.type === 'PERCENTAGE'
            ? `${row.original.value}%`
            : `${row.original.value} F CFA`}
        </span>
      ),
    },
    {
      accessorKey: 'usedCount',
      header: 'Utilisation',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-brand-ivory rounded-full overflow-hidden w-24 border border-brand-ink/5">
              <div
                className="h-full bg-brand-gold"
                style={{
                  width: `${Math.min(100, (row.original.usedCount / (row.original.maxUses || 100)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-brand-ink/40">
              {row.original.usedCount}
              {row.original.maxUses ? `/${row.original.maxUses}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ getValue }) => {
        const active = getValue<boolean>();
        return (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit border ${
              active
                ? 'bg-green-500/10 text-green-700 border-green-500/20'
                : 'bg-brand-ink/5 text-brand-ink/40 border-brand-ink/10'
            }`}
          >
            {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {active ? 'Actif' : 'Inactif'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() =>
              setConfirmTarget({
                id: row.original.id,
                code: row.original.code,
                isActive: row.original.isActive,
              })
            }
            className={`p-2 rounded-xl transition-all ${
              row.original.isActive
                ? 'text-amber-600 hover:bg-amber-600/10'
                : 'text-green-600 hover:bg-green-600/10'
            }`}
            title={row.original.isActive ? 'Désactiver' : 'Activer'}
          >
            {row.original.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          </button>
          <button
            className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ivory rounded-xl transition-all"
            title="Détails"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Codes Promo"
        description="Gérez vos remises et campagnes marketing."
        action={
          <button
            onClick={() => router.push('/admin/promo-codes/nouveau')}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold hover:text-brand-ink transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-ink/10"
          >
            <Plus size={16} />
            Nouveau Code
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={promoCodes}
        isLoading={loading}
        pageCount={pageCount}
        pageIndex={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={isProcessing}
        variant={confirmTarget?.isActive ? 'warning' : 'info'}
        title={confirmTarget?.isActive ? 'Désactiver le code' : 'Activer le code'}
        description={`Voulez-vous vraiment ${confirmTarget?.isActive ? 'désactiver' : 'activer'} le code promo "${confirmTarget?.code}" ?`}
        confirmText="Confirmer"
      />
    </div>
  );
}
