'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  priceCents: number;
  stock: number;
  stockStatus: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface StockForm {
  delta: number;
  reason: string;
  note: string;
}

const STOCK_COLORS: Record<string, string> = {
  IN_STOCK: 'text-green-700',
  LOW_STOCK: 'text-amber-600',
  OUT_OF_STOCK: 'text-red-600',
};

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState<StockForm>({
    delta: 0,
    reason: 'ADJUSTMENT',
    note: '',
  });

  const load = () => {
    setLoading(true);
    adminApi.products
      .list()
      .then((r) => {
        setProducts(r.items as Product[]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce produit ?')) return;
    try {
      await adminApi.products.delete(id);
      setSuccess('Produit désactivé.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleStockAdjust = async () => {
    if (!stockTarget) return;
    try {
      await adminApi.products.adjustStock(stockTarget.id, stockForm);
      setSuccess('Stock ajusté.');
      setStockTarget(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Produit',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.name}</p>
          <p className="text-xs text-gray-400">
            {row.original.brand} · {row.original.sku}
          </p>
        </div>
      ),
    },
    { accessorKey: 'priceCents', header: 'Prix', cell: ({ getValue }) => fmt(getValue<number>()) },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={`text-sm font-medium ${STOCK_COLORS[row.original.stockStatus] ?? ''}`}>
          {row.original.stock} ({row.original.stockStatus})
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getValue<boolean>() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
        >
          {getValue<boolean>() ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStockTarget(row.original);
              setStockForm({ delta: 0, reason: 'ADJUSTMENT', note: '' });
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Stock
          </button>
          {row.original.isActive && (
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Désactiver
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={`Produits (${total})`} />

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
        <DataTable columns={columns} data={products} />
      )}

      {/* Stock adjustment modal */}
      {stockTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-semibold">Ajuster le stock</h2>
            <p className="text-sm text-gray-600">
              {stockTarget.name} — stock actuel : {stockTarget.stock}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Delta (positif = entrée, négatif = sortie)
              </label>
              <input
                type="number"
                value={stockForm.delta}
                onChange={(e) =>
                  setStockForm((f) => ({ ...f, delta: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Raison</label>
              <select
                value={stockForm.reason}
                onChange={(e) => setStockForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {['ADJUSTMENT', 'PURCHASE', 'RETURN', 'DAMAGED', 'INITIAL'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Note (optionnel)
              </label>
              <input
                value={stockForm.note}
                onChange={(e) => setStockForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Raison détaillée…"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStockTarget(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleStockAdjust}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
