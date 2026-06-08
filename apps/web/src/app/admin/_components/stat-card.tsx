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
  iconColor = 'bg-notion-hover',
  iconTextColor = 'text-notion-textSecondary',
  trend,
}: StatCardProps) {
  return (
    <div className="admin-card p-5 group hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <p className="admin-label">{label}</p>
        {Icon && (
          <div
            className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${iconColor}`}
          >
            <Icon size={16} className={iconTextColor} />
          </div>
        )}
      </div>

      <p className="mt-3 text-3xl font-semibold text-notion-text leading-none tracking-tight">
        {value}
      </p>

      {(sub || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-notion-textSecondary">{sub}</span>}
        </div>
      )}
    </div>
  );
}
