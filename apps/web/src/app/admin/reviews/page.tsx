'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';

import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; email: string };
  product: { id: string; name: string };
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.reviews
      .list()
      .then((r) => {
        setReviews(r.items as Review[]);
        setTotal(r.total);
      })
      .catch((e: Error) => toast.error('Erreur', { description: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    try {
      await adminApi.reviews.approve(id);
      toast.success('Avis approuvé');
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.reviews.delete(deleteTarget.id);
      toast.success('Avis supprimé');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Review>[] = [
    {
      header: 'Produit',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-brand-ink">{row.original.product.name}</span>
      ),
    },
    {
      header: 'Client',
      cell: ({ row }) => (
        <span className="text-xs text-brand-ink/40 font-medium">{row.original.user.email}</span>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Note',
      cell: ({ getValue }) => (
        <span className="text-amber-500 text-sm tracking-tight">{stars(getValue<number>())}</span>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Commentaire',
      cell: ({ getValue }) => (
        <p className="text-sm text-brand-ink/60 max-w-xs line-clamp-2">{getValue<string>()}</p>
      ),
    },
    {
      accessorKey: 'isApproved',
      header: 'Statut',
      cell: ({ getValue }) => {
        const approved = getValue<boolean>();
        return (
          <span
            className={`admin-badge ${
              approved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}
          >
            {approved ? 'Approuvé' : 'En attente'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs text-brand-ink/40 tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {!row.original.isApproved && (
            <button
              onClick={() => approve(row.original.id)}
              className="p-2 text-brand-ink/30 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              title="Approuver"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          <button
            onClick={() => setDeleteTarget(row.original)}
            className="p-2 text-brand-ink/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={`Avis (${total})`} description="Modération des avis produit" />

      <DataTable columns={columns} data={reviews} isLoading={loading} total={total} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        title="Supprimer cet avis"
        description={`Voulez-vous supprimer l'avis de ${deleteTarget?.user.email} sur "${deleteTarget?.product.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  );
}
