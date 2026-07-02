import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  used: number;
  limit: number | string;
  unit?: string;
}

export function ProgressBar({ label, used, limit, unit = '' }: ProgressBarProps) {
  const isUnlimited = typeof limit === 'string';
  const numLimit = isUnlimited ? 0 : (limit as number);
  const pct = isUnlimited ? 0 : numLimit > 0 ? Math.min(100, Math.round((used / numLimit) * 100)) : 0;

  // Color thresholds
  const barColor = pct >= 90
    ? 'bg-gradient-to-r from-rose-500 to-red-600'
    : pct >= 75
      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
      : 'bg-gradient-to-r from-[var(--color-primary)] to-[color-mix(in_srgb,var(--color-primary)_70%,#60a5fa)]';

  const healthLabel = isUnlimited
    ? 'Unlimited'
    : pct >= 90
      ? 'Critical'
      : pct >= 75
        ? 'Warning'
        : 'Healthy';

  const healthStyle = isUnlimited
    ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
    : pct >= 90
      ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
      : pct >= 75
        ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
        : 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40';

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
            {used}{unit}
            <span className="text-[var(--color-text-muted)] font-normal mx-0.5">/</span>
            {isUnlimited ? limit : `${limit}${unit}`}
          </span>
          <span className={cn(
            'inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
            healthStyle
          )}>
            {healthLabel}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="h-2 w-full rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full fe-progress-fill shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
            isUnlimited ? 'bg-gradient-to-r from-[var(--color-primary)] to-emerald-400' : barColor
          )}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>

      {/* Footer: percentage */}
      <p className="text-[10px] text-[var(--color-text-muted)] text-right font-semibold uppercase tracking-wide">
        {isUnlimited ? '∞ Unlimited' : `${pct}% used`}
      </p>
    </div>
  );
}
