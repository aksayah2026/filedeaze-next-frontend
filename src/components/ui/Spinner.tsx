import { cn } from '@/lib/utils';

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-[var(--color-primary)]', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-xs text-[var(--color-text-muted)] font-medium animate-pulse">Loading…</p>
    </div>
  );
}

/** Skeleton block for loading placeholders */
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('fe-skeleton h-4 rounded-md', className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <SkeletonLine className="w-24 h-3" />
      <SkeletonLine className="w-16 h-7" />
      <SkeletonLine className="w-32 h-3" />
    </div>
  );
}
