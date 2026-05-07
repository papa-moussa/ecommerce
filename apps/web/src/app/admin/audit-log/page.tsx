'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Download, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      .catch((e: Error) => toast.error('Erreur de chargement', { description: e.message }))
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
        <span className="text-xs text-brand-ink/40 whitespace-nowrap tabular-nums font-medium">
          {new Date(getValue<string>()).toLocaleString('fr-FR')}
        </span>
      ),
    },
    {
      header: 'Admin',
      cell: ({ row }) => (
        <span className="text-xs text-brand-ink/60 font-medium">{row.original.user.email}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] bg-brand-ink/[0.05] text-brand-ink px-2 py-1 rounded-lg border border-brand-ink/[0.06]">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'resource',
      header: 'Ressource',
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-brand-ink/70">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'resourceId',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-brand-ink/30">
          {(getValue<string | null>() ?? '—').slice(-8)}
        </span>
      ),
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: ({ getValue }) => (
        <span className="text-xs text-brand-ink/30 tabular-nums">
          {getValue<string | null>() ?? '—'}
        </span>
      ),
    },
    {
      id: 'diff',
      header: '',
      cell: ({ row }) =>
        row.original.after ? (
          <button
            onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-ink transition-colors px-2 py-1 rounded-lg hover:bg-brand-gold/10"
          >
            {expanded === row.original.id ? 'Masquer' : 'Diff'}
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
            <button onClick={() => exportCsv(logs)} className="admin-btn-primary">
              <Download size={14} />
              Exporter CSV
            </button>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <div className="mb-6 admin-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="admin-label">Ressource</label>
          <input
            value={filters.resource}
            onChange={(e) => setFilters((f) => ({ ...f, resource: e.target.value }))}
            placeholder="ex: product"
            className="admin-input h-9 py-0 w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="admin-label">Action</label>
          <input
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            placeholder="ex: product.create"
            className="admin-input h-9 py-0 w-52"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="admin-label">Du</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="admin-input h-9 py-0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="admin-label">Au</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="admin-input h-9 py-0"
          />
        </div>
        <button onClick={load} className="admin-btn-primary h-9">
          <Filter size={14} />
          Filtrer
        </button>
      </div>

      <div className="space-y-2">
        <DataTable columns={columns} data={logs} isLoading={loading} total={total} />

        {/* Expanded diff panels */}
        {logs
          .filter((l) => expanded === l.id)
          .map((l) => (
            <div
              key={`diff-${l.id}`}
              className="admin-card border-brand-gold/20 bg-brand-ivory/30 p-4"
            >
              <p className="admin-label mb-3">Payload — {l.action}</p>
              <pre className="text-xs overflow-auto custom-scrollbar whitespace-pre-wrap text-brand-ink/70 max-h-64 font-mono bg-brand-ink/[0.03] rounded-xl p-4">
                {JSON.stringify(l.after, null, 2)}
              </pre>
            </div>
          ))}
      </div>
    </div>
  );
}
