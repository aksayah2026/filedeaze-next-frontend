import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  trend?: { value: number; label?: string };
  accentColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-[var(--color-primary)]',
  iconBg = 'bg-[var(--color-primary-light)]',
  subtitle,
  trend,
  accentColor = 'bg-[var(--color-primary)]',
}: StatsCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 card-hover',
        'shadow-[var(--shadow-sm)] animate-fe-fade-in transition-all duration-250 ease-in-out'
      )}
    >
      {/* Left accent bar — slim 2px, more premium */}
      <div className={cn('absolute left-0 top-3 bottom-3 w-0.5 rounded-full', accentColor)} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3 pl-2">
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 select-none">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md',
              trendPositive
                ? 'text-[var(--color-success)] bg-[var(--color-success-light)]'
                : 'text-[var(--color-danger)] bg-[var(--color-danger-light)]'
            )}>
              {trendPositive
                ? <TrendingUp size={11} />
                : <TrendingDown size={11} />
              }
              {Math.abs(trend.value)}% {trend.label ?? 'vs last month'}
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn(
            'flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
            'transition-transform duration-200 group-hover:scale-105',
            'bg-[var(--color-surface-elevated)]',
          )}>
            <Icon size={18} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
