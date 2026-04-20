'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

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

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.reviews
      .list()
      .then((r) => {
        setReviews(r.items as Review[]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    try {
      await adminApi.reviews.approve(id);
      setSuccess('Avis approuvé.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      await adminApi.reviews.delete(id);
      setSuccess('Avis supprimé.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const columns: ColumnDef<Review>[] = [
    {
      header: 'Produit',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.product.name}</span>,
    },
    {
      header: 'Client',
      cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.user.email}</span>,
    },
    {
      accessorKey: 'rating',
      header: 'Note',
      cell: ({ getValue }) => (
        <span className="text-amber-500 text-sm">{stars(getValue<number>())}</span>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Commentaire',
      cell: ({ getValue }) => (
        <p className="text-sm text-gray-700 max-w-xs line-clamp-2">{getValue<string>()}</p>
      ),
    },
    {
      accessorKey: 'isApproved',
      header: 'Statut',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getValue<boolean>() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
        >
          {getValue<boolean>() ? 'Approuvé' : 'En attente'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('fr-FR'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-3">
          {!row.original.isApproved && (
            <button
              onClick={() => approve(row.original.id)}
              className="text-xs text-green-600 hover:underline"
            >
              Approuver
            </button>
          )}
          <button
            onClick={() => remove(row.original.id)}
            className="text-xs text-red-600 hover:underline"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={`Avis (${total})`} description="Modération des avis produit" />

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

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : (
        <DataTable columns={columns} data={reviews} />
      )}
    </div>
  );
}
