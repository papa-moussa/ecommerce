'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';

import { PageHeader } from '../../_components/page-header';

export default function NewPromoCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    maxUses: '',
    minOrderCents: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.promoCodes.create({
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        minOrderCents: formData.minOrderCents ? Number(formData.minOrderCents) : undefined,
      });
      toast.success('Code promo créé');
      router.push('/admin/promo-codes');
    } catch (err) {
      toast.error('Erreur', { description: (err as Error).message || 'Une erreur est survenue' });
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nouveau Code Promo"
        description="Créez une remise ou campagne marketing."
      />

      <form onSubmit={handleSubmit} className="admin-card p-8 space-y-6">
        <div className="space-y-5">
          <div>
            <label className="admin-label block mb-1.5">Code</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="admin-input font-mono tracking-widest uppercase"
              placeholder="SUMMER24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label block mb-1.5">Type de remise</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="admin-select"
              >
                <option value="PERCENTAGE">Pourcentage (%)</option>
                <option value="FIXED_AMOUNT">Montant fixe</option>
                <option value="FREE_SHIPPING">Livraison gratuite</option>
              </select>
            </div>
            <div>
              <label className="admin-label block mb-1.5">
                Valeur ({formData.type === 'PERCENTAGE' ? '%' : 'F CFA'})
              </label>
              <input
                type="number"
                required={formData.type !== 'FREE_SHIPPING'}
                disabled={formData.type === 'FREE_SHIPPING'}
                min="1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="admin-input disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label block mb-1.5">
                Limite d&apos;utilisations (optionnel)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="admin-input"
                placeholder="Ex: 100"
              />
            </div>
            <div>
              <label className="admin-label block mb-1.5">
                Montant minimum d&apos;achat (optionnel)
              </label>
              <input
                type="number"
                min="1"
                value={formData.minOrderCents}
                onChange={(e) => setFormData({ ...formData, minOrderCents: e.target.value })}
                className="admin-input"
                placeholder="Ex: 50000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-ink/[0.06]">
          <button type="button" onClick={() => router.back()} className="admin-btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="admin-btn-primary">
            {loading ? 'Création…' : 'Créer le code'}
          </button>
        </div>
      </form>
    </div>
  );
}
