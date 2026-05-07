import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string; // tailwind bg class e.g. "bg-brand-gold/10"
  iconTextColor?: string; // tailwind text class e.g. "text-brand-gold"
  trend?: number; // positive = up, negative = down (percentage)
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'bg-brand-gold/10',
  iconTextColor = 'text-brand-gold',
  trend,
}: StatCardProps) {
  return (
    <div className="admin-card p-6 group hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <p className="admin-label">{label}</p>
        {Icon && (
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
          >
            <Icon size={18} className={iconTextColor} />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-serif font-bold text-brand-ink leading-none tracking-tight">
        {value}
      </p>

      {(sub || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-[11px] text-brand-ink/40 font-medium">{sub}</span>}
        </div>
      )}
    </div>
  );
}
