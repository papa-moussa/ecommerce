'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-api';

import { DataTable } from '../_components/data-table';
import { PageHeader } from '../_components/page-header';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
  user: { id: string; email: string };
}

function exportCsv(logs: AuditLog[]) {
  const headers = ['Date', 'Admin', 'Action', 'Ressource', 'ID', 'IP'];
  const rows = logs.map((l) => [
    new Date(l.createdAt).toLocaleString('fr-FR'),
    l.user.email,
    l.action,
    l.resource,
    l.resourceId ?? '',
    l.ip ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({ resource: '', action: '', from: '', to: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.resource) params['resource'] = filters.resource;
    if (filters.action) params['action'] = filters.action;
    if (filters.from) params['from'] = filters.from;
    if (filters.to) params['to'] = filters.to;

    adminApi.auditLog
      .list(Object.keys(params).length ? params : undefined)
      .then((r) => {
        setLogs(r.items as AuditLog[]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(getValue<string>()).toLocaleString('fr-FR')}
        </span>
      ),
    },
    {
      header: 'Admin',
      cell: ({ row }) => <span className="text-xs">{row.original.user.email}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          {getValue<string>()}
        </span>
      ),
    },
    { accessorKey: 'resource', header: 'Ressource' },
    {
      accessorKey: 'resourceId',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-400">
          {(getValue<string | null>() ?? '—').slice(-8)}
        </span>
      ),
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-400">{getValue<string | null>() ?? '—'}</span>
      ),
    },
    {
      id: 'diff',
      header: 'Diff',
      cell: ({ row }) =>
        row.original.after ? (
          <button
            onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded === row.original.id ? 'Masquer' : 'Voir'}
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Audit log (${total})`}
        description="Toutes les actions admin mutantes"
        action={
          logs.length > 0 ? (
            <button
              onClick={() => exportCsv(logs)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Exporter CSV
            </button>
          ) : undefined
        }
      />

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={filters.resource}
          onChange={(e) => setFilters((f) => ({ ...f, resource: e.target.value }))}
          placeholder="Ressource (ex: product)"
          className="border rounded px-3 py-1.5 text-sm w-44"
        />
        <input
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          placeholder="Action (ex: product.create)"
          className="border rounded px-3 py-1.5 text-sm w-52"
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="border rounded px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="border rounded px-3 py-1.5 text-sm"
        />
        <button
          onClick={load}
          className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          Filtrer
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : (
        <div className="space-y-0">
          <DataTable columns={columns} data={logs} />
          {/* Expanded diff rows */}
          {logs
            .filter((l) => expanded === l.id)
            .map((l) => (
              <div
                key={`diff-${l.id}`}
                className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-4"
              >
                <p className="text-xs font-medium text-blue-700 mb-2">Payload — {l.action}</p>
                <pre className="text-xs overflow-auto whitespace-pre-wrap text-gray-700 max-h-64">
                  {JSON.stringify(l.after, null, 2)}
                </pre>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
