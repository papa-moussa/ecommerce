'use client';

import { AlertTriangle, BarChart3, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminApi, type MetricsOverview, type Period, type TimeseriesPoint } from '@/lib/admin-api';
import { fmtAdmin } from '@/lib/admin-currency';

import { AdminCard } from './_components/admin-card';
import { PageHeader } from './_components/page-header';
import { StatCard } from './_components/stat-card';

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '90d', label: '90 jours' },
];

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
        description="Vue d'ensemble de votre activité"
        action={
          <div className="flex items-center gap-1 bg-brand-ivory/40 p-1 rounded-xl border border-brand-ink/[0.06]">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-brand-ink text-brand-ivory shadow-lg shadow-brand-ink/20'
                    : 'text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ivory'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-card p-6 h-28 animate-pulse bg-brand-ivory/40" />
          ))}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Chiffre d'affaires"
              value={fmtAdmin(overview.totalRevenueCents)}
              sub={`sur ${period}`}
              icon={TrendingUp}
              iconColor="bg-brand-gold/10"
              iconTextColor="text-brand-gold"
            />
            <StatCard
              label="Commandes"
              value={overview.orderCount}
              sub={`sur ${period}`}
              icon={ShoppingBag}
              iconColor="bg-blue-50"
              iconTextColor="text-blue-500"
            />
            <StatCard
              label="Panier moyen"
              value={fmtAdmin(overview.avgCartCents)}
              icon={BarChart3}
              iconColor="bg-purple-50"
              iconTextColor="text-purple-500"
            />
            <StatCard
              label="Stock faible"
              value={overview.lowStock.length}
              sub={overview.lowStock.length > 0 ? 'produits sous seuil' : 'Tout OK'}
              icon={Package}
              iconColor={overview.lowStock.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
              iconTextColor={overview.lowStock.length > 0 ? 'text-amber-500' : 'text-emerald-500'}
            />
          </div>

          {/* Revenue Chart */}
          <AdminCard title={`Chiffre d'affaires — ${period}`} className="mb-6" noPadding>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A961" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C9A961" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F0F1008" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#0F0F1040', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 100).toFixed(0)}€`}
                    tick={{ fontSize: 10, fill: '#0F0F1040', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v) => [fmtAdmin(v as number), 'CA']}
                    contentStyle={{
                      background: '#0F0F10',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#F5F1E8',
                      fontSize: '12px',
                      padding: '8px 14px',
                    }}
                    labelStyle={{
                      color: '#C9A961',
                      fontWeight: 700,
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                    cursor={{ stroke: '#C9A961', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C9A961"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#C9A961', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          {/* Top Products */}
          <AdminCard title="Top produits" noPadding className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-ink/[0.06]">
                  <th className="px-6 py-3 text-left admin-label">Produit</th>
                  <th className="px-6 py-3 text-right admin-label">Qté</th>
                  <th className="px-6 py-3 text-right admin-label">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink/[0.04]">
                {overview.topProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-brand-gold/[0.03] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-brand-ink">{p.productName}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-brand-ink/60 tabular-nums">
                      {p._sum.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-brand-ink tabular-nums">
                      {fmtAdmin(p._sum.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminCard>

          {/* Low Stock Alert */}
          {overview.lowStock.length > 0 && (
            <AdminCard className="border-amber-200 bg-amber-50/60">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-2">
                    {overview.lowStock.length} produit{overview.lowStock.length > 1 ? 's' : ''} en
                    stock faible
                  </p>
                  <ul className="space-y-1">
                    {overview.lowStock.map((p) => (
                      <li key={p.id} className="text-sm text-amber-700">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-amber-600/70 ml-2">— {p.stock} restant(s)</span>
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
                          {p.stockStatus}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AdminCard>
          )}
        </>
      ) : null}
    </div>
  );
}
