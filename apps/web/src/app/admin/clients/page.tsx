'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  Calendar,
  Info,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminApi } from '@/lib/admin-api';
import { fmtAdmin } from '@/lib/admin-currency';

import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  blocked: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface UserDetail extends User {
  phone: string | null;
  ltvCents: number;
  orders: Array<{ id: string; status: string; totalCents: number; createdAt: string }>;
}

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'block' | 'promote';
    user: User;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const load = useCallback(
    async (currentPage = page, currentLimit = limit, query = q) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: currentLimit.toString(),
        };
        if (query) params.q = query;

        const r = await adminApi.users.list(params);
        setUsers(r.items as User[]);
        setTotal(r.total);
        setPageCount(r.pages);
      } catch (e) {
        toast.error('Erreur de chargement', { description: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [page, limit, q],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      const { type, user } = confirmTarget;
      if (type === 'block') {
        await adminApi.users.update(user.id, { blocked: !user.blocked });
        toast.success(user.blocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué');
      } else if (type === 'promote') {
        await adminApi.users.update(user.id, { role: 'ADMIN' });
        toast.success('Rôle mis à jour en ADMIN');
      }
      setConfirmTarget(null);
      load();
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const d = await adminApi.users.get(id);
      setDetail(d as UserDetail);
    } catch (e) {
      toast.error('Erreur', { description: (e as Error).message });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      header: 'Client',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-ivory flex items-center justify-center border border-brand-ink/5 text-brand-gold font-bold">
            {row.original.firstName[0]}
            {row.original.lastName[0]}
          </div>
          <div>
            <p className="font-bold text-brand-ink">
              {row.original.firstName} {row.original.lastName}
            </p>
            <p className="text-[10px] text-brand-ink/40 font-semibold uppercase tracking-widest">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            getValue<string>() === 'ADMIN'
              ? 'bg-brand-ink text-brand-ivory border border-brand-ink'
              : 'bg-brand-ivory text-brand-gold border border-brand-gold/10'
          }`}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'blocked',
      header: 'Statut',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            getValue<boolean>()
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}
        >
          {getValue<boolean>() ? 'Bloqué' : 'Actif'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Inscrit',
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-brand-ink/60">
          {new Date(getValue<string>()).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openDetail(row.original.id)}
            className="p-2 text-brand-ink/40 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all"
            title="Détails"
          >
            <Info size={16} />
          </button>
          <button
            onClick={() => setConfirmTarget({ type: 'block', user: row.original })}
            className={`p-2 rounded-lg transition-all ${
              row.original.blocked
                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                : 'text-brand-ink/40 hover:text-red-600 hover:bg-red-50'
            }`}
            title={row.original.blocked ? 'Débloquer' : 'Bloquer'}
          >
            {row.original.blocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
          </button>
          {row.original.role !== 'ADMIN' && (
            <button
              onClick={() => setConfirmTarget({ type: 'promote', user: row.original })}
              className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ink/5 rounded-lg transition-all"
              title="Promouvoir Admin"
            >
              <UserPlus size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Clients (${total})`} />

      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-brand-ink/5 shadow-sm max-w-md">
        <div className="pl-3 text-brand-ink/20">
          <Search size={18} />
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1, limit, q)}
          placeholder="Rechercher par email, nom…"
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-brand-ink/20 outline-none"
        />
        <button
          onClick={() => load(1, limit, q)}
          className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold transition-all"
        >
          Chercher
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
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
        onConfirm={handleAction}
        isLoading={isProcessing}
        variant={confirmTarget?.type === 'block' ? 'warning' : 'info'}
        title={
          confirmTarget
            ? confirmTarget.type === 'block'
              ? confirmTarget.user.blocked
                ? 'Débloquer le client'
                : 'Bloquer le client'
              : 'Promouvoir Administrateur'
            : ''
        }
        description={
          confirmTarget
            ? confirmTarget.type === 'block'
              ? `Voulez-vous vraiment ${confirmTarget.user.blocked ? 'débloquer' : 'bloquer'} l'accès de ${confirmTarget.user.firstName} ${confirmTarget.user.lastName} au site ?`
              : `Êtes-vous sûr de vouloir accorder des privilèges d'administrateur à ${confirmTarget.user.firstName} ${confirmTarget.user.lastName} ?`
            : ''
        }
        confirmText="Confirmer"
      />

      {/* User detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-brand-ink/5 bg-brand-ivory/30 flex justify-between items-start">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-white shadow-xl flex items-center justify-center text-2xl font-bold text-brand-gold border border-brand-ink/5">
                  {detail.firstName[0]}
                  {detail.lastName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-brand-ink">
                    {detail.firstName} {detail.lastName}
                  </h2>
                  <p className="text-xs text-brand-ink/40 font-medium flex items-center gap-2 mt-1">
                    <Mail size={12} /> {detail.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-brand-gold hover:text-brand-ivory transition-all text-brand-ink/40"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-brand-ivory/20 p-4 rounded-2xl border border-brand-ink/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 mb-1">
                    Valeur Totale (LTV)
                  </p>
                  <p className="text-lg font-serif text-brand-ink">{fmtAdmin(detail.ltvCents)}</p>
                </div>
                <div className="bg-brand-ivory/20 p-4 rounded-2xl border border-brand-ink/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 mb-1">
                    Commandes
                  </p>
                  <p className="text-lg font-serif text-brand-ink">{detail.orders.length}</p>
                </div>
                <div className="bg-brand-ivory/20 p-4 rounded-2xl border border-brand-ink/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/30 mb-1">
                    Statut Compte
                  </p>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mt-2 ${detail.blocked ? 'text-red-500' : 'text-green-600'}`}
                  >
                    {detail.blocked ? 'Bloqué' : 'Actif'}
                  </p>
                </div>
              </div>

              {/* Info Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ink/60 border-b border-brand-ink/5 pb-2">
                  Informations Profil
                </h3>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-ivory/50 rounded-lg text-brand-gold">
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-widest">
                        Téléphone
                      </p>
                      <p className="text-sm font-medium">{detail.phone ?? 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-ivory/50 rounded-lg text-brand-gold">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-widest">
                        Inscrit le
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(detail.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ink/60 border-b border-brand-ink/5 pb-2">
                  Dernières Commandes
                </h3>
                {detail.orders.length === 0 ? (
                  <div className="py-8 text-center bg-brand-ivory/10 rounded-2xl border border-brand-ink/5">
                    <p className="text-xs text-brand-ink/30 font-medium italic">
                      Aucun historique de commande.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-brand-ink/5 bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-brand-ivory/30 text-[10px] uppercase font-bold text-brand-ink/40">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-ink/5">
                        {detail.orders.map((o) => (
                          <tr key={o.id} className="hover:bg-brand-gold/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-brand-ink/60">
                              #{o.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-brand-ink/5 bg-brand-ivory/50">
                                {o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              {fmtAdmin(o.totalCents)}
                            </td>
                            <td className="px-4 py-3 text-right text-brand-ink/40 font-medium">
                              {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-brand-ivory/30 border-t border-brand-ink/5 flex justify-end">
              <button
                onClick={() => setDetail(null)}
                className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-brand-ink text-brand-ivory rounded-xl hover:bg-brand-gold transition-all shadow-lg"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
