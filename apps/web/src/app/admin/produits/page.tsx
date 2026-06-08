'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';
import { fmtAdmin } from '@/lib/admin-currency';

import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { ImageUpload } from '../_components/image-upload';
import { PageHeader } from '../_components/page-header';

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  slug: string;
  priceCents: number;
  stock: number;
  stockStatus: string;
  isActive: boolean;
  isFeatured: boolean;
  images?: Array<{ url: string; isMain: boolean }>;
  sizeMl?: number;
  concentration?: string;
  family?: string;
  variants?: Array<{ id: string; sizeMl: number; priceCents: number; stock: number }>;
  description?: string;
  categoryId?: string;
  gender: string;
  storyTelling?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
}

interface StockForm {
  delta: number;
  reason: string;
  note: string;
  variantId?: string;
}

interface ProductForm {
  name: string;
  brand: string;
  sku: string;
  slug: string;
  priceCents: string;
  stock: string;
  description: string;
  categoryId: string;
  gender: string;
  storyTelling: string;
  topNotes: string; // Will be split by comma
  heartNotes: string;
  baseNotes: string;
  isActive: boolean;
  isFeatured: boolean;
  mainImageUrl?: string;
  priceXof: string;
  sizeMl: string;
  concentration: string;
  family: string;
  variants: Array<{ sizeMl: string; priceXof: string; stock: string }>;
}

interface Category {
  id: string;
  name: string;
}

const STOCK_COLORS: Record<string, string> = {
  IN_STOCK: 'text-green-700',
  LOW_STOCK: 'text-amber-600',
  OUT_OF_STOCK: 'text-red-600',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState<StockForm>({
    delta: 0,
    reason: 'ADJUSTMENT',
    note: '',
    variantId: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'marketing' | 'stocks' | 'galerie'>(
    'general',
  );

  const emptyForm: ProductForm = {
    name: '',
    brand: '',
    sku: '',
    slug: '',
    priceCents: '',
    stock: '',
    description: '',
    categoryId: '',
    gender: 'UNISEXE',
    storyTelling: '',
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    isActive: true,
    isFeatured: false,
    mainImageUrl: '',
    variants: [{ sizeMl: '100', priceXof: '', stock: '0' }],
    priceXof: '',
    sizeMl: '',
    concentration: '',
    family: '',
  };
  const [productForm, setProductForm] = useState<ProductForm>(emptyForm);

  const load = useCallback(
    async (currentPage = page, currentLimit = limit) => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          adminApi.products.list({
            page: currentPage.toString(),
            limit: currentLimit.toString(),
          }),
          adminApi.categories.list(),
        ]);
        setProducts(pRes.items as Product[]);
        setTotal(pRes.total);
        setPageCount(pRes.pages);
        setCategories(cRes as unknown as Category[]);
      } catch (e) {
        toast.error('Erreur de chargement', { description: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await adminApi.products.delete(deleteId);
      toast.success('Produit supprimé', { description: 'Le produit a été définitivement retiré.' });
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error('Erreur lors de la suppression', { description: (e as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPayload = (f: ProductForm) => {
    const firstVariant = f.variants[0];
    if (!firstVariant) throw new Error('Au moins une contenance est requise.');

    const basePriceCents = Math.round(parseFloat(firstVariant.priceXof));

    return {
      name: f.name,
      brand: f.brand,
      sku: f.sku,
      description: f.description,
      categoryId: f.categoryId,
      gender: f.gender,
      concentration: f.concentration || null,
      family: f.family || null,
      storyTelling: f.storyTelling,
      priceCents: basePriceCents,
      stock: parseInt(firstVariant.stock, 10) || 0,
      sizeMl: parseInt(firstVariant.sizeMl, 10) || null,
      variants: f.variants.map((v) => ({
        sizeMl: parseInt(v.sizeMl, 10),
        priceCents: Math.round(parseFloat(v.priceXof)),
        stock: parseInt(v.stock, 10) || 0,
      })),
      topNotes: f.topNotes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      heartNotes: f.heartNotes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      baseNotes: f.baseNotes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      slug: f.slug || f.name.toLowerCase().replace(/ /g, '-'),
      isActive: f.isActive,
      isFeatured: f.isFeatured,
    };
  };

  const handleCreate = async () => {
    try {
      const product = (await adminApi.products.create(formatPayload(productForm))) as Product;

      if (productForm.mainImageUrl) {
        await adminApi.products.addImage(product.id, {
          url: productForm.mainImageUrl,
          isMain: true,
          position: 0,
        });
      }

      toast.success('Produit créé', {
        description: `${productForm.name} a été ajouté au catalogue.`,
      });
      setShowCreateForm(false);
      setProductForm(emptyForm);
      load();
    } catch (e) {
      toast.error('Erreur de création', { description: (e as Error).message });
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      await adminApi.products.update(editTarget.id, formatPayload(productForm));

      if (productForm.mainImageUrl) {
        await adminApi.products.addImage(editTarget.id, {
          url: productForm.mainImageUrl,
          isMain: true,
          position: 0,
        });
      }

      toast.success('Produit mis à jour');
      setEditTarget(null);
      load();
    } catch (e) {
      toast.error('Erreur de mise à jour', { description: (e as Error).message });
    }
  };

  const handleStockAdjust = async () => {
    if (!stockTarget) return;
    try {
      await adminApi.products.adjustStock(stockTarget.id, stockForm);
      toast.success('Stock mis à jour', {
        description: `Le stock de ${stockTarget.name} a été ajusté.`,
      });
      setStockTarget(null);
      load();
    } catch (e) {
      toast.error('Erreur de stock', { description: (e as Error).message });
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Produit',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0]?.url && (
            <div className="relative h-10 w-10 rounded-md bg-notion-hover overflow-hidden border border-notion-border shrink-0">
              <Image src={row.original.images[0].url} alt="" fill className="object-cover" />
            </div>
          )}
          <div>
            <p className="font-medium text-notion-text">{row.original.name}</p>
            <p className="text-xs text-notion-textSecondary">
              {row.original.brand} · {row.original.sku}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'priceCents',
      header: 'Prix',
      cell: ({ getValue }) => (
        <span className="font-medium text-notion-text">{fmtAdmin(getValue<number>())}</span>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className={`text-sm font-medium ${STOCK_COLORS[row.original.stockStatus] ?? ''}`}>
            {row.original.stock} unités
          </span>
          <span className="text-xs text-notion-textSecondary">
            {row.original.stockStatus === 'IN_STOCK'
              ? 'En stock'
              : row.original.stockStatus === 'LOW_STOCK'
                ? 'Stock critique'
                : 'Rupture'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
            getValue<boolean>()
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-notion-hover text-notion-textSecondary border border-notion-border'
          }`}
        >
          {getValue<boolean>() ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              const p = row.original as Product;
              setEditTarget(p);
              setProductForm({
                name: p.name,
                brand: p.brand,
                sku: p.sku,
                slug: p.slug,
                priceCents: String(p.priceCents),
                stock: String(p.stock),
                description: p.description || '',
                categoryId: p.categoryId || '',
                gender: p.gender || 'UNISEXE',
                storyTelling: p.storyTelling || '',
                topNotes: (p.topNotes || []).join(', '),
                heartNotes: (p.heartNotes || []).join(', '),
                baseNotes: (p.baseNotes || []).join(', '),
                isActive: p.isActive,
                isFeatured: p.isFeatured,
                mainImageUrl: p.images?.[0]?.url || '',
                priceXof: String(p.priceCents),
                sizeMl: p.sizeMl ? String(p.sizeMl) : '',
                concentration: p.concentration || '',
                family: p.family || '',
                variants: (p.variants || []).map((v) => ({
                  sizeMl: String(v.sizeMl),
                  priceXof: String(v.priceCents),
                  stock: String(v.stock),
                })),
              });
            }}
            className="p-2 text-notion-textSecondary hover:text-notion-text hover:bg-notion-hover rounded-md transition-colors"
            title="Modifier"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => {
              const p = row.original as Product;
              setStockTarget(p);
              setStockForm({
                delta: 0,
                reason: 'ADJUSTMENT',
                note: '',
                variantId: p.variants?.[0]?.id || '',
              });
            }}
            className="p-2 text-notion-textSecondary hover:text-notion-text hover:bg-notion-hover rounded-md transition-colors"
            title="Ajuster Stock"
          >
            <Box size={16} />
          </button>
          <button
            onClick={() => setDeleteId(row.original.id)}
            className="p-2 text-notion-textSecondary hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Produits (${total})`}
        action={
          <button
            onClick={() => {
              setShowCreateForm(true);
              setProductForm(emptyForm);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-notion-text text-white rounded-md hover:bg-notion-text/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nouveau produit
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        pageCount={pageCount}
        pageIndex={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action supprimera également toutes les variantes et les images associées. C'est irréversible."
        confirmText="Supprimer définitivement"
      />

      <AnimatePresence mode="wait">
        {(showCreateForm || editTarget) && (
          <motion.div
            key="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-ink/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-notion-border"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-notion-border flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-lg font-semibold text-notion-text">
                    {editTarget ? 'Modifier le produit' : 'Nouveau produit'}
                  </h2>
                  <p className="text-sm text-notion-textSecondary">
                    Configurez les détails du produit.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditTarget(null);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-notion-hover transition-colors text-notion-textSecondary"
                >
                  ✕
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-notion-border px-6 bg-notion-hover/30 gap-4">
                {[
                  { id: 'general', label: 'Général' },
                  { id: 'marketing', label: 'Marketing' },
                  { id: 'stocks', label: 'Formats & Stocks' },
                  { id: 'galerie', label: 'Galerie' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setActiveTab(t.id as 'general' | 'marketing' | 'stocks' | 'galerie')
                    }
                    className={`py-3 text-sm font-medium transition-colors relative ${
                      activeTab === t.id
                        ? 'text-notion-text'
                        : 'text-notion-textSecondary hover:text-notion-text'
                    }`}
                  >
                    {t.label}
                    {activeTab === t.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-notion-textSecondary"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { key: 'name', label: 'Nom du parfum *', placeholder: 'Ex: Oud Élixir' },
                        {
                          key: 'brand',
                          label: 'Maison / Marque *',
                          placeholder: 'Ex: Giorgio Armani',
                        },
                        { key: 'sku', label: 'SKU *', placeholder: 'Ex: AR-001' },
                        {
                          key: 'slug',
                          label: 'Slug URL (optionnel)',
                          placeholder: 'Ex: stronger-with-you',
                        },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                            {label}
                          </label>
                          <input
                            value={productForm[key as keyof ProductForm] as string}
                            onChange={(e) =>
                              setProductForm((f) => ({ ...f, [key]: e.target.value }))
                            }
                            placeholder={placeholder}
                            className="admin-input"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                          Catégorie *
                        </label>
                        <select
                          value={productForm.categoryId}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, categoryId: e.target.value }))
                          }
                          className="admin-input appearance-none"
                        >
                          <option value="">Sélectionner une catégorie</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                          Genre *
                        </label>
                        <select
                          value={productForm.gender}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, gender: e.target.value }))
                          }
                          className="admin-input appearance-none"
                        >
                          <option value="HOMME">Homme</option>
                          <option value="FEMME">Femme</option>
                          <option value="UNISEXE">Unisexe</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-8 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={productForm.isActive}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, isActive: e.target.checked }))
                          }
                          className="w-5 h-5 rounded border-brand-ink/10 text-brand-gold focus:ring-brand-gold transition-all"
                        />
                        <span className="text-sm font-bold text-brand-ink/60 group-hover:text-brand-ink">
                          Produit Actif
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={productForm.isFeatured}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, isFeatured: e.target.checked }))
                          }
                          className="w-5 h-5 rounded border-brand-ink/10 text-brand-gold focus:ring-brand-gold transition-all"
                        />
                        <span className="text-sm font-bold text-brand-ink/60 group-hover:text-brand-ink">
                          Mettre en avant
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'marketing' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                          Type (Concentration)
                        </label>
                        <select
                          value={productForm.concentration}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, concentration: e.target.value }))
                          }
                          className="admin-input"
                        >
                          <option value="">Sélectionner</option>
                          {[
                            'EAU_FRAICHE',
                            'EAU_DE_COLOGNE',
                            'EAU_DE_TOILETTE',
                            'EAU_DE_PARFUM',
                            'PARFUM',
                            'EXTRAIT_DE_PARFUM',
                          ].map((t) => (
                            <option key={t} value={t}>
                              {t.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                          Famille Olfactive
                        </label>
                        <select
                          value={productForm.family}
                          onChange={(e) =>
                            setProductForm((f) => ({ ...f, family: e.target.value }))
                          }
                          className="admin-input"
                        >
                          <option value="">Sélectionner</option>
                          {[
                            'HESPERIDE',
                            'FLORAL',
                            'BOISE',
                            'ORIENTAL',
                            'AMBRE',
                            'FOUGERE',
                            'CHYPRE',
                            'CUIR',
                          ].map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                        Description courte *
                      </label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm((f) => ({ ...f, description: e.target.value }))
                        }
                        rows={3}
                        className="admin-input resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                        L'histoire (Storytelling)
                      </label>
                      <textarea
                        value={productForm.storyTelling}
                        onChange={(e) =>
                          setProductForm((f) => ({ ...f, storyTelling: e.target.value }))
                        }
                        rows={4}
                        className="admin-input resize-none"
                      />
                    </div>

                    <div className="bg-brand-ivory/30 p-6 rounded-2xl border border-brand-ink/5 space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ink/60 border-b border-brand-ink/5 pb-2">
                        Notes Olfactives
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        {[
                          { key: 'topNotes', label: 'Tête', color: 'bg-amber-100' },
                          { key: 'heartNotes', label: 'Cœur', color: 'bg-rose-100' },
                          { key: 'baseNotes', label: 'Fond', color: 'bg-stone-200' },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">
                              <span className={`w-2 h-2 rounded-full ${color}`} />
                              {label}
                            </label>
                            <input
                              value={productForm[key as keyof ProductForm] as string}
                              onChange={(e) =>
                                setProductForm((f) => ({ ...f, [key]: e.target.value }))
                              }
                              placeholder="Note 1, Note 2..."
                              className="admin-input text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stocks' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-brand-ink">Formats & Capacités</h3>
                        <p className="text-xs text-brand-ink/40">
                          Gérez le stock et le prix pour chaque contenance.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((f) => ({
                            ...f,
                            variants: [...f.variants, { sizeMl: '', priceXof: '', stock: '0' }],
                          }))
                        }
                        className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-brand-ink text-brand-ivory rounded-lg hover:bg-brand-gold transition-all"
                      >
                        + Ajouter un format
                      </button>
                    </div>

                    <div className="space-y-4">
                      {productForm.variants.map((v, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i}
                          className="grid grid-cols-12 gap-4 p-4 bg-brand-ivory/20 rounded-2xl border border-brand-ink/5 items-end relative group hover:border-brand-gold/20 transition-all"
                        >
                          <div className="col-span-3 space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 ml-1">
                              Taille (ml)
                            </label>
                            <input
                              type="number"
                              value={v.sizeMl}
                              onChange={(e) => {
                                const newVariants = productForm.variants.map((variant, idx) =>
                                  idx === i ? { ...variant, sizeMl: e.target.value } : variant,
                                );
                                setProductForm({ ...productForm, variants: newVariants });
                              }}
                              className="admin-input"
                              placeholder="Ex: 50"
                            />
                          </div>
                          <div className="col-span-4 space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 ml-1">
                              Prix (FCFA)
                            </label>
                            <input
                              type="number"
                              value={v.priceXof}
                              onChange={(e) => {
                                const newVariants = productForm.variants.map((variant, idx) =>
                                  idx === i ? { ...variant, priceXof: e.target.value } : variant,
                                );
                                setProductForm({ ...productForm, variants: newVariants });
                              }}
                              className="admin-input"
                            />
                          </div>
                          <div className="col-span-3 space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 ml-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => {
                                const newVariants = productForm.variants.map((variant, idx) =>
                                  idx === i ? { ...variant, stock: e.target.value } : variant,
                                );
                                setProductForm({ ...productForm, variants: newVariants });
                              }}
                              className="admin-input"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center pb-2">
                            <button
                              type="button"
                              disabled={productForm.variants.length === 1}
                              onClick={() => {
                                const newVariants = [...productForm.variants];
                                newVariants.splice(i, 1);
                                setProductForm({ ...productForm, variants: newVariants });
                              }}
                              className="h-9 w-9 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-20"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'galerie' && (
                  <div className="space-y-6">
                    <div className="bg-brand-gold/5 p-6 rounded-2xl border border-brand-gold/10">
                      <h3 className="text-sm font-bold text-brand-ink mb-4">Image Principale</h3>
                      <ImageUpload
                        value={productForm.mainImageUrl || ''}
                        onChange={(url) => setProductForm((f) => ({ ...f, mainImageUrl: url }))}
                        onRemove={() => setProductForm((f) => ({ ...f, mainImageUrl: '' }))}
                        folder="products"
                      />
                      <p className="mt-4 text-[11px] text-brand-ink/40 font-medium italic">
                        Cette image sera utilisée dans le catalogue et en haut de la page produit.
                      </p>
                    </div>

                    <div className="p-6 border-2 border-dashed border-brand-ink/10 rounded-2xl flex flex-col items-center justify-center py-12 opacity-50">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">
                        Galerie Photos
                      </p>
                      <p className="text-[10px] font-medium text-brand-ink/30 italic">
                        (Fonctionnalité multi-photos bientôt disponible)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-brand-ivory/50 border-t border-brand-ink/5 flex gap-4 justify-end items-center">
                <p className="text-[10px] text-brand-ink/30 italic mr-auto font-medium">
                  Tous les champs marqués * sont obligatoires.
                </p>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditTarget(null);
                  }}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-ink/60 hover:text-brand-ink transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={editTarget ? handleEdit : handleCreate}
                  className="px-10 py-3 text-xs font-bold uppercase tracking-[0.2em] bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold transition-all shadow-xl shadow-brand-ink/20 active:scale-95"
                >
                  {editTarget ? 'Enregistrer les modifications' : 'Créer le produit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {stockTarget && (
          <motion.div
            key="stock-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-ink/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-white/20"
            >
              {/* Header */}
              <div className="p-6 border-b border-brand-ink/5 bg-brand-ivory/30">
                <h2 className="text-xl font-serif text-brand-ink">Ajustement du stock</h2>
                <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-widest mt-1">
                  {stockTarget.name}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Variant Selector */}
                {stockTarget.variants && stockTarget.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                      Format à ajuster
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {stockTarget.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setStockForm({ ...stockForm, variantId: v.id })}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                            stockForm.variantId === v.id
                              ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                              : 'border-brand-ink/5 bg-brand-ivory/20 hover:border-brand-gold/50'
                          }`}
                        >
                          <span className="text-xs font-bold text-brand-ink">{v.sizeMl}ml</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-brand-ink/40 font-medium">
                              Actuel:
                            </span>
                            <span className="text-xs font-bold text-brand-ink">{v.stock}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delta Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                    Quantité (Entrée/Sortie)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stockForm.delta}
                      onChange={(e) =>
                        setStockForm((f) => ({ ...f, delta: parseInt(e.target.value, 10) || 0 }))
                      }
                      className="admin-input text-center font-medium"
                      placeholder="0"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      {stockForm.delta > 0 ? (
                        <Plus size={16} className="text-green-600" />
                      ) : stockForm.delta < 0 ? (
                        <Trash2 size={16} className="text-red-600" />
                      ) : (
                        <Box size={16} className="text-brand-ink/20" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                    Motif de l'ajustement
                  </label>
                  <select
                    value={stockForm.reason}
                    onChange={(e) => setStockForm((f) => ({ ...f, reason: e.target.value }))}
                    className="admin-input appearance-none"
                  >
                    <option value="ADJUSTMENT">Ajustement Manuel</option>
                    <option value="PURCHASE">Réassort (Nouvel Achat)</option>
                    <option value="RETURN">Retour Client</option>
                    <option value="DAMAGED">Perte / Produit Cassé</option>
                  </select>
                </div>

                {/* Note Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40 ml-1">
                    Commentaire (Optionnel)
                  </label>
                  <input
                    value={stockForm.note}
                    onChange={(e) => setStockForm((f) => ({ ...f, note: e.target.value }))}
                    className="admin-input"
                    placeholder="Ex: Inventaire périodique..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-brand-ivory/30 border-t border-brand-ink/5 flex gap-3">
                <button
                  onClick={() => setStockTarget(null)}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStockAdjust}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold transition-all shadow-lg shadow-brand-ink/10"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
