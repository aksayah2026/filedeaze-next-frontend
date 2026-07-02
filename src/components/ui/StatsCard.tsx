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
  staggerClass?: string;
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
  staggerClass,
}: StatsCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={cn('dashboard-kpi-card group', staggerClass)}>
      {/* Gradient top accent edge */}
      <div className={cn('absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl', accentColor)} />

      {/* Subtle gradient overlay that deepens on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 3%, transparent) 0%, transparent 60%)',
        }}
      />

      <div className="relative p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          {/* Left: title + value + subtitle + trend */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em] mb-2 select-none">
              {title}
            </p>
            <p className="text-[2rem] font-bold text-[var(--color-text-primary)] tabular-nums leading-none">
              {value}
            </p>
            {subtitle && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate leading-relaxed">
                {subtitle}
              </p>
            )}
            {trend && (
              <div
                className={cn(
                  'mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                  trendPositive
                    ? 'text-[var(--color-success)] bg-[var(--color-success-light)]'
                    : 'text-[var(--color-danger)] bg-[var(--color-danger-light)]'
                )}
              >
                {trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trend.value)}% {trend.label ?? 'vs last month'}
              </div>
            )}
          </div>

          {/* Right: floating icon badge */}
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center',
                'transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-4deg]',
                'fe-icon-bounce shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
                iconBg,
              )}
            >
              <Icon size={19} className={iconColor} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
