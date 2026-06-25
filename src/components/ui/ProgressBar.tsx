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
  
  // Custom color thresholds based on utilization level
  const color = pct >= 90 
    ? 'bg-gradient-to-r from-red-500 to-rose-600' 
    : pct >= 75 
      ? 'bg-gradient-to-r from-amber-500 to-amber-600' 
      : 'bg-gradient-to-r from-blue-500 to-blue-600';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-[var(--color-text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--color-text-primary)]">
          {used}
          {unit}
          <span className="text-[var(--color-text-muted)] font-normal"> / </span>
          {isUnlimited ? limit : `${limit}${unit}`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--color-surface-elevated)] overflow-hidden shadow-inner">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
            isUnlimited ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : color
          )}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          {isUnlimited ? 'Unlimited' : `${pct}% Used`}
        </span>
      </div>
    </div>
  );
}
