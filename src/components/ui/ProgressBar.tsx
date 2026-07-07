import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  used: number;
  limit: number | string;
  unit?: string;
}

export function ProgressBar({ label, used, limit, unit = '' }: ProgressBarProps) {
  const strLimit = String(limit).trim().toUpperCase();
  const isUnlimited = strLimit === 'UNLIMITED' || strLimit === '∞';
  // Attempt to parse out numbers from strings like "10 GB"
  const parsedLimit = parseFloat(String(limit).replace(/[^\d.]/g, ''));
  const numLimit = isUnlimited ? 0 : isNaN(parsedLimit) ? 0 : parsedLimit;
  const pct = isUnlimited ? 0 : numLimit > 0 ? Math.min(100, Math.round((used / numLimit) * 100)) : 0;

  // Prevent "GB GB" duplication
  const displayLimit = (typeof limit === 'string' && limit.includes(unit.trim())) 
    ? limit 
    : `${limit}${unit}`;

  // Color thresholds
  const barColor = pct >= 100
    ? 'bg-[var(--color-danger)] shadow-[0_0_8px_var(--color-danger)]'
    : pct >= 90
      ? 'bg-[var(--color-danger)]'
      : pct >= 75
        ? 'bg-[var(--color-warning)]'
        : 'bg-gradient-to-r from-[var(--color-primary)] to-[color-mix(in_srgb,var(--color-primary)_70%,#60a5fa)]';

  const healthLabel = isUnlimited
    ? 'Unlimited'
    : pct >= 100
      ? 'Full'
      : pct >= 90
        ? 'Critical'
        : pct >= 75
          ? 'Warning'
          : 'Healthy';

  const HealthIcon = isUnlimited
    ? InfinityIcon
    : pct >= 100
      ? AlertCircle
      : pct >= 90
        ? AlertCircle
        : pct >= 75
          ? AlertTriangle
          : CheckCircle2;

  const healthStyle = isUnlimited
    ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary)]/20'
    : pct >= 100
      ? 'text-white bg-[var(--color-danger)] shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse ring-1 ring-[var(--color-danger)]'
      : pct >= 90
        ? 'text-[var(--color-danger)] bg-[var(--color-danger-light)] dark:bg-[var(--color-danger)]/10 ring-1 ring-[var(--color-danger)]/30'
        : pct >= 75
          ? 'text-[var(--color-warning)] bg-[var(--color-warning-light)] dark:bg-[var(--color-warning)]/10 ring-1 ring-[var(--color-warning)]/30'
          : 'text-[var(--color-success)] bg-[var(--color-success-light)] dark:bg-[var(--color-success)]/10 ring-1 ring-[var(--color-success)]/30';

  return (
    <div className="group px-3 py-2 -mx-3 rounded-[14px] hover:bg-[var(--color-surface-hover)] transition-all duration-200 cursor-default">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        {/* Left side: Label + inline percentage on hover */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
            {label}
          </span>
          {!isUnlimited && (
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity",
              pct >= 100 && "text-[var(--color-danger)] bg-[var(--color-danger-light)] dark:bg-[var(--color-danger)]/10"
            )}>
              {pct}%
            </span>
          )}
        </div>
        
        {/* Right side: Usage numbers + Health badge */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-baseline gap-0.5 tabular-nums">
            <span className="text-[13px] font-bold text-[var(--color-text-primary)] group-hover:scale-105 transition-transform origin-right">
              {used}{unit}
            </span>
            <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
              <span className="mx-0.5 opacity-50">/</span>
              {isUnlimited ? '∞' : displayLimit}
            </span>
          </span>
          
          <span className={cn(
            'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-[3px] rounded-full',
            healthStyle
          )}>
            <HealthIcon size={10} strokeWidth={2.5} />
            {healthLabel}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="h-1.5 w-full rounded-full bg-[var(--color-border)] dark:bg-[var(--color-surface-elevated)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isUnlimited ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)]' : barColor
          )}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
