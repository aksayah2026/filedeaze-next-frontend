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
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{used}{unit} / {isUnlimited ? limit : `${limit}${unit}`}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isUnlimited ? 'bg-emerald-400' : color)}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-0.5">{isUnlimited ? 'Unlimited' : `${pct}%`}</p>
    </div>
  );
}
