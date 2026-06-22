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
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  subtitle,
  trend,
  accentColor = 'bg-blue-500',
}: StatsCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white border border-slate-100 p-5 card-hover',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-fe-fade-in'
      )}
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', accentColor)} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 text-xs font-medium',
              trendPositive ? 'text-emerald-600' : 'text-red-500'
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
            'flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center',
            'transition-transform duration-200 group-hover:scale-105',
            iconBg
          )}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
