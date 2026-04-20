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

interface ProductForm {
  name: string;
  brand: string;
  sku: string;
  priceCents: string;
  stock: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const emptyForm: ProductForm = {
    name: '',
    brand: '',
    sku: '',
    priceCents: '',
    stock: '',
    description: '',
    isActive: true,
    isFeatured: false,
  };
  const [productForm, setProductForm] = useState<ProductForm>(emptyForm);

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

  const handleCreate = async () => {
    try {
      const payload = {
        ...productForm,
        priceCents: Math.round(parseFloat(productForm.priceCents) * 100),
        stock: parseInt(productForm.stock, 10) || 0,
      };
      await adminApi.products.create(payload);
      setSuccess('Produit créé.');
      setShowCreateForm(false);
      setProductForm(emptyForm);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      const payload = {
        ...productForm,
        priceCents: Math.round(parseFloat(productForm.priceCents) * 100),
      };
      await adminApi.products.update(editTarget.id, payload);
      setSuccess('Produit mis à jour.');
      setEditTarget(null);
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
              setEditTarget(row.original);
              setProductForm({
                name: row.original.name,
                brand: row.original.brand,
                sku: row.original.sku,
                priceCents: (row.original.priceCents / 100).toFixed(2),
                stock: String(row.original.stock),
                description: '',
                isActive: row.original.isActive,
                isFeatured: row.original.isFeatured,
              });
            }}
            className="text-xs text-indigo-600 hover:underline"
          >
            Éditer
          </button>
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
      <PageHeader
        title={`Produits (${total})`}
        action={
          <button
            onClick={() => {
              setShowCreateForm(true);
              setProductForm(emptyForm);
            }}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            + Nouveau produit
          </button>
        }
      />

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

      {/* Create / Edit product modal */}
      {(showCreateForm || editTarget) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">
                {editTarget ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditTarget(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {[
              { key: 'name', label: 'Nom *', placeholder: 'Ex: Oud Élixir' },
              { key: 'brand', label: 'Marque *', placeholder: 'Ex: Maison Parfum' },
              { key: 'sku', label: 'SKU *', placeholder: 'Ex: MP-001' },
              { key: 'priceCents', label: 'Prix (€) *', placeholder: 'Ex: 89.90', type: 'number' },
              { key: 'stock', label: 'Stock initial', placeholder: '0', type: 'number' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type ?? 'text'}
                  value={productForm[key as keyof ProductForm] as string}
                  onChange={(e) => setProductForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Description du parfum…"
              />
            </div>
            <div className="flex gap-6">
              {[
                { key: 'isActive', label: 'Actif' },
                { key: 'isFeatured', label: 'Mis en avant' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={productForm[key as keyof ProductForm] as boolean}
                    onChange={(e) => setProductForm((f) => ({ ...f, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditTarget(null);
                }}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={editTarget ? handleEdit : handleCreate}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                {editTarget ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
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
