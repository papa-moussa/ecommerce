'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminApi, type MetricsOverview, type Period, type TimeseriesPoint } from '@/lib/admin-api';

import { PageHeader } from './_components/page-header';
import { StatCard } from './_components/stat-card';

const PERIODS: Period[] = ['7d', '30d', '90d'];

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([adminApi.metrics.overview(period), adminApi.metrics.timeseries('revenue', period)])
      .then(([ov, ts]) => {
        setOverview(ov);
        setSeries(ts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        action={
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  period === p
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Chiffre d'affaires"
              value={fmt(overview.totalRevenueCents)}
              sub={`sur ${period}`}
            />
            <StatCard label="Commandes" value={overview.orderCount} sub={`sur ${period}`} />
            <StatCard label="Panier moyen" value={fmt(overview.avgCartCents)} />
            <StatCard
              label="Stock faible"
              value={overview.lowStock.length}
              sub={overview.lowStock.length > 0 ? '⚠ produits sous seuil' : '✓ OK'}
            />
          </div>

          {/* Revenue chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Chiffre d&apos;affaires ({period})
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 100).toFixed(0)}€`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => fmt(v as number)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top products */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">Top produits</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500 bg-gray-50">
                <tr>
                  <th className="px-5 py-2.5 text-left">Produit</th>
                  <th className="px-5 py-2.5 text-right">Qté</th>
                  <th className="px-5 py-2.5 text-right">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overview.topProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5">{p.productName}</td>
                    <td className="px-5 py-2.5 text-right">{p._sum.quantity}</td>
                    <td className="px-5 py-2.5 text-right">{fmt(p._sum.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low stock alert */}
          {overview.lowStock.length > 0 && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-800 mb-2">⚠ Produits en stock faible</p>
              <ul className="space-y-1">
                {overview.lowStock.map((p) => (
                  <li key={p.id} className="text-sm text-amber-700">
                    {p.name} — {p.stock} restant(s) ({p.stockStatus})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
