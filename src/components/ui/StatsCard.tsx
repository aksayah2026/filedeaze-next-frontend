'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'primary' | 'standard' | 'status';
export type StatusChip = 'healthy' | 'live' | 'stable' | 'attention' | 'action';

interface StatsCardProps {
  /** Visual variant: primary (revenue hero), standard (metrics), status (health) */
  variant?: CardVariant;
  title: string;
  value: string | number;
  icon?: LucideIcon;
  /** Role hex accent — applied to icon, border, hover glow only */
  accentHex?: string;
  /** Short business context below the value */
  context: string;
  /** Optional trend e.g. "+12%" or "▲ 3" */
  trend?: { label: string; direction: 'up' | 'down' | 'flat' };
  /** Semantic status chip */
  status?: StatusChip;
  /** Footer timestamp */
  footerText: string;
  staggerClass?: string;
}

// ─── Status chip config ───────────────────────────────────────────────────────

const statusConfig: Record<StatusChip, { label: string; bg: string; text: string; dot: string }> = {
  healthy:  { label: '● Healthy',          bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  live:     { label: '● Live',             bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  stable:   { label: '● Stable',           bg: 'bg-indigo-50 dark:bg-indigo-500/10',   text: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500'  },
  attention:{ label: '● Attention',        bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500'   },
  action:   { label: '● Action Required',  bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-700 dark:text-red-400',         dot: 'bg-red-500'     },
};

// ─── Icon wrapper ─────────────────────────────────────────────────────────────

function IconBadge({ Icon, accentHex, size = 14 }: { Icon: LucideIcon; accentHex: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
      style={{
        width: size + 20,
        height: size + 20,
        background: `${accentHex}14`,
        boxShadow: `0 0 0 1px ${accentHex}20`,
      }}
    >
      <Icon size={size} style={{ color: accentHex }} />
    </div>
  );
}

// ─── StatusChip ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: StatusChip }) {
  const s = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide', s.bg, s.text)}>
      {s.label}
    </span>
  );
}

// ─── Trend indicator ──────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: NonNullable<StatsCardProps['trend']> }) {
  const up = trend.direction === 'up';
  const flat = trend.direction === 'flat';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
        flat
          ? 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400'
          : up
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
      )}
    >
      {!flat && (up ? <TrendingUp size={9} /> : <TrendingDown size={9} />)}
      {trend.label}
    </span>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function CardShell({
  accentHex,
  className,
  staggerClass,
  children,
}: {
  accentHex: string;
  className?: string;
  staggerClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-[var(--color-border)] bg-[var(--color-surface)]',
        'shadow-sm transition-all duration-200',
        'hover:-translate-y-[2px]',
        className,
        staggerClass
      )}
      style={{
        ['--accent' as string]: accentHex,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 28px rgba(0,0,0,0.10), 0 0 0 1px ${accentHex}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] rounded-t-2xl transition-all duration-200 group-hover:h-[3px]"
        style={{ background: accentHex, opacity: 0.75 }}
      />
      {children}
    </div>
  );
}

// ─── PRIMARY variant — Revenue hero ──────────────────────────────────────────

function PrimaryCard({ title, value, icon: Icon, accentHex = '#2563EB', context, trend, status, footerText, staggerClass }: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-5 pt-5 pb-4">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={14} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Hero value */}
      <p
        className="text-[2.4rem] font-extrabold tabular-nums tracking-tight text-[var(--color-text-primary)] leading-none mb-1 transition-transform duration-200 group-hover:scale-[1.01] origin-left"
      >
        {value}
      </p>

      {/* Context */}
      <p className="text-[11px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">{context}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto">
        {status && <StatusPill status={status} />}
        <p className="text-[10px] text-[var(--color-text-muted)] ml-auto">{footerText}</p>
      </div>
    </CardShell>
  );
}

// ─── STANDARD variant — Metrics ──────────────────────────────────────────────

function StandardCard({ title, value, icon: Icon, accentHex = '#2563EB', context, trend, status, footerText, staggerClass }: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-4 pt-4 pb-3.5">
      {/* Top: icon row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={13} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Value */}
      <p className="text-[1.85rem] font-bold tabular-nums tracking-tight text-[var(--color-text-primary)] leading-none mb-1.5 transition-transform duration-200 group-hover:scale-[1.01] origin-left">
        {value}
      </p>

      {/* Context */}
      <p className="text-[11px] text-[var(--color-text-secondary)] mb-3">{context}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        {status && <StatusPill status={status} />}
        <p className="text-[10px] text-[var(--color-text-muted)] ml-auto">{footerText}</p>
      </div>
    </CardShell>
  );
}

// ─── STATUS variant — Health-focused ─────────────────────────────────────────

function StatusCard({ title, value, icon: Icon, accentHex = '#2563EB', context, trend, status, footerText, staggerClass }: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-4 pt-4 pb-3.5">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={13} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Value — compact since status is the hero */}
      <p className="text-[1.7rem] font-bold tabular-nums tracking-tight text-[var(--color-text-primary)] leading-none mb-1.5">
        {value}
      </p>

      {/* Status chip is the main message */}
      <div className="mb-3 flex items-center gap-2">
        {status && <StatusPill status={status} />}
      </div>

      {/* Context is the supporting text */}
      <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">{context}</p>

      {/* Footer */}
      <p className="text-[10px] text-[var(--color-text-muted)] mt-auto">{footerText}</p>
    </CardShell>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function StatsCard(props: StatsCardProps) {
  const { variant = 'standard' } = props;
  if (variant === 'primary') return <PrimaryCard {...props} />;
  if (variant === 'status')  return <StatusCard {...props} />;
  return <StandardCard {...props} />;
}
