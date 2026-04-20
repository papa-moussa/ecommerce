'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

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

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.users
      .list(q ? { q } : undefined)
      .then((r) => {
        setUsers(r.items as User[]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const openDetail = async (id: string) => {
    try {
      const d = await adminApi.users.get(id);
      setDetail(d as UserDetail);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toggleBlock = async (u: User) => {
    if (!confirm(u.blocked ? 'Débloquer cet utilisateur ?' : 'Bloquer cet utilisateur ?')) return;
    try {
      await adminApi.users.update(u.id, { blocked: !u.blocked });
      setSuccess(u.blocked ? 'Utilisateur débloqué.' : 'Utilisateur bloqué.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const promoteAdmin = async (u: User) => {
    if (!confirm('Promouvoir en ADMIN ?')) return;
    try {
      await adminApi.users.update(u.id, { role: 'ADMIN' });
      setSuccess('Rôle mis à jour.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">
            {row.original.firstName} {row.original.lastName}
          </p>
          <p className="text-xs text-gray-400">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getValue<string>() === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
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
          className={`text-xs ${getValue<boolean>() ? 'text-red-600 font-medium' : 'text-green-700'}`}
        >
          {getValue<boolean>() ? '⛔ Bloqué' : '✓ Actif'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Inscrit',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('fr-FR'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => openDetail(row.original.id)}
            className="text-xs text-blue-600 hover:underline"
          >
            Détail
          </button>
          <button
            onClick={() => toggleBlock(row.original)}
            className={`text-xs hover:underline ${row.original.blocked ? 'text-green-600' : 'text-amber-600'}`}
          >
            {row.original.blocked ? 'Débloquer' : 'Bloquer'}
          </button>
          {row.original.role !== 'ADMIN' && (
            <button
              onClick={() => promoteAdmin(row.original)}
              className="text-xs text-purple-600 hover:underline"
            >
              → Admin
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={`Clients (${total})`} />

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

      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Rechercher par email, nom…"
          className="border rounded px-3 py-1.5 text-sm w-72"
        />
        <button
          onClick={load}
          className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          Chercher
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : (
        <DataTable columns={columns} data={users} />
      )}

      {/* User detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-semibold">
                {detail.firstName} {detail.lastName}
              </h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="text-sm space-y-1 text-gray-600">
              <p>
                Email : <span className="text-gray-900">{detail.email}</span>
              </p>
              <p>
                Téléphone : <span className="text-gray-900">{detail.phone ?? '—'}</span>
              </p>
              <p>
                Rôle : <span className="text-gray-900">{detail.role}</span>
              </p>
              <p>
                Statut :{' '}
                <span className={detail.blocked ? 'text-red-600 font-medium' : 'text-green-700'}>
                  {detail.blocked ? 'Bloqué' : 'Actif'}
                </span>
              </p>
              <p className="pt-2 font-semibold text-gray-900 text-base">
                LTV : {fmt(detail.ltvCents)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">5 dernières commandes</h3>
              {detail.orders.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune commande.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-gray-500 uppercase">
                    <tr>
                      <th className="text-left py-1">ID</th>
                      <th>Statut</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-1 font-mono">{o.id.slice(-8)}</td>
                        <td className="text-center">{o.status}</td>
                        <td className="text-right">{fmt(o.totalCents)}</td>
                        <td className="text-right">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
