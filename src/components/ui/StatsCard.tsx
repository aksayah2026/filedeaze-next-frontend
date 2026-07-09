'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CardVariant = 'primary' | 'standard' | 'status';
export type StatusChip =
  | 'healthy'
  | 'growing'
  | 'live'
  | 'stable'
  | 'available'
  | 'attention'
  | 'followup'
  | 'critical'
  | 'offline'
  | 'ontrack'
  | 'completed'
  | 'online'
  | 'review'
  | 'action';

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
  footerText?: string;
  staggerClass?: string;
}

// ─── Status chip config ───────────────────────────────────────────────────────

const statusConfig: Record<StatusChip, {
  label: string;
  gradientFrom: string;
  gradientTo: string;
  text: string;
  dotColor: string;
}> = {
  healthy: {
    label: 'Healthy',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  growing: {
    label: 'Growing',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  live: {
    label: 'Live',
    gradientFrom: 'rgba(20,184,166,0.10)',
    gradientTo:   'rgba(20,184,166,0.04)',
    text:    'text-teal-700 dark:text-teal-400',
    dotColor: '#14b8a6',
  },
  stable: {
    label: 'Stable',
    gradientFrom: 'rgba(59,130,246,0.10)',
    gradientTo:   'rgba(59,130,246,0.04)',
    text:    'text-blue-700 dark:text-blue-400',
    dotColor: '#3b82f6',
  },
  available: {
    label: 'Available',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  attention: {
    label: 'Needs Attention',
    gradientFrom: 'rgba(245,158,11,0.10)',
    gradientTo:   'rgba(245,158,11,0.04)',
    text:    'text-amber-700 dark:text-amber-400',
    dotColor: '#f59e0b',
  },
  followup: {
    label: 'Follow-up Required',
    gradientFrom: 'rgba(245,158,11,0.10)',
    gradientTo:   'rgba(245,158,11,0.04)',
    text:    'text-amber-700 dark:text-amber-400',
    dotColor: '#f59e0b',
  },
  critical: {
    label: 'Critical',
    gradientFrom: 'rgba(239,68,68,0.10)',
    gradientTo:   'rgba(239,68,68,0.04)',
    text:    'text-red-700 dark:text-red-400',
    dotColor: '#ef4444',
  },
  offline: {
    label: 'Offline',
    gradientFrom: 'rgba(107,114,128,0.10)',
    gradientTo:   'rgba(107,114,128,0.04)',
    text:    'text-gray-700 dark:text-gray-400',
    dotColor: '#6b7280',
  },
  ontrack: {
    label: 'On Track',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  completed: {
    label: '80% Completed',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  online: {
    label: 'Online',
    gradientFrom: 'rgba(16,185,129,0.10)',
    gradientTo:   'rgba(16,185,129,0.04)',
    text:    'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  review: {
    label: 'Review Required',
    gradientFrom: 'rgba(245,158,11,0.10)',
    gradientTo:   'rgba(245,158,11,0.04)',
    text:    'text-amber-700 dark:text-amber-400',
    dotColor: '#f59e0b',
  },
  action: {
    label: 'Action Required',
    gradientFrom: 'rgba(239,68,68,0.10)',
    gradientTo:   'rgba(239,68,68,0.04)',
    text:    'text-red-600 dark:text-red-400',
    dotColor: '#ef4444',
  },
};

// â”€â”€â”€ Icon wrapper â€” gradient circle with soft radial glow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IconBadge({
  Icon,
  accentHex,
  size = 14,
}: {
  Icon: LucideIcon;
  accentHex: string;
  size?: number;
}) {
  const pad = size <= 13 ? 18 : 22;
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      {/* Soft radial glow behind the icon circle (8â€“10% opacity) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentHex}18 0%, transparent 75%)`,
          transform: 'scale(1.75)',
        }}
      />
      {/* Gradient icon container with white icon */}
      <div
        className="relative flex items-center justify-center rounded-full transition-transform duration-[250ms] ease-out group-hover:rotate-[4deg]"
        style={{
          width:  size + pad,
          height: size + pad,
          background: `linear-gradient(135deg, ${accentHex}CC 0%, ${accentHex}88 100%)`,
          boxShadow: `0 1px 6px ${accentHex}28, 0 0 0 1px ${accentHex}1A`,
        }}
      >
        <Icon size={size} color="#ffffff" strokeWidth={2.2} />
      </div>
    </div>
  );
}

// â”€â”€â”€ StatusChip â€” translucent gradient pill with animated dot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusPill({ status }: { status: StatusChip }) {
  const s = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px]',
        'text-[10px] font-semibold tracking-wide',
        s.text,
      )}
      style={{
        background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`,
        border: `1px solid ${s.dotColor}22`,
      }}
    >
      {/* Pulsing animated dot */}
      <span className="relative flex h-[5px] w-[5px] shrink-0">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping"
          style={{ backgroundColor: s.dotColor }}
        />
        <span
          className="relative inline-flex h-[5px] w-[5px] rounded-full"
          style={{ backgroundColor: s.dotColor }}
        />
      </span>
      {s.label}
    </span>
  );
}

// â”€â”€â”€ Trend badge â€” semantic gradient pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TrendBadge({ trend }: { trend: NonNullable<StatsCardProps['trend']> }) {
  const up   = trend.direction === 'up';
  const flat = trend.direction === 'flat';

  const styles = flat
    ? {
        from:   'rgba(100,116,139,0.10)',
        to:     'rgba(100,116,139,0.04)',
        border: 'rgba(100,116,139,0.18)',
        cls:    'text-slate-500 dark:text-slate-400',
      }
    : up
    ? {
        from:   'rgba(16,185,129,0.12)',
        to:     'rgba(16,185,129,0.04)',
        border: 'rgba(16,185,129,0.22)',
        cls:    'text-emerald-700 dark:text-emerald-400',
      }
    : {
        from:   'rgba(239,68,68,0.12)',
        to:     'rgba(239,68,68,0.04)',
        border: 'rgba(239,68,68,0.22)',
        cls:    'text-red-600 dark:text-red-400',
      };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-[3px] text-[10px] font-bold',
        styles.cls,
      )}
      style={{
        background: `linear-gradient(135deg, ${styles.from}, ${styles.to})`,
        border: `1px solid ${styles.border}`,
      }}
    >
      {!flat && (up ? <TrendingUp size={9} /> : <TrendingDown size={9} />)}
      {trend.label}
    </span>
  );
}

// â”€â”€â”€ Card shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        'shadow-sm transition-all duration-[250ms] ease-out',
        'hover:-translate-y-[3px]',
        className,
        staggerClass,
      )}
      style={{
        ['--accent' as string]: accentHex,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 12px 36px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px ${accentHex}22`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)';
      }}
    >
      {/* â”€â”€ Premium gradient top accent line â€” replaces solid border */}
      <div
        className="absolute left-0 right-0 top-0 z-10 h-[2px] rounded-t-2xl transition-all duration-[250ms] ease-out group-hover:h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${accentHex}00 0%, ${accentHex}DD 35%, ${accentHex}FF 60%, ${accentHex}55 85%, ${accentHex}00 100%)`,
        }}
      />

      {/* â”€â”€ Soft ambient glow in top-right corner */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentHex}0D 0%, transparent 68%)`,
        }}
      />

      {/* â”€â”€ Subtle noise texture overlay (1â€“2% opacity) for tactile depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.018,
          mixBlendMode: 'overlay',
        }}
      />

      {children}
    </div>
  );
}

// â”€â”€â”€ PRIMARY variant â€” Revenue hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PrimaryCard({
  title, value, icon: Icon, accentHex = '#2563EB',
  context, trend, status, footerText, staggerClass,
}: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-5 pt-5 pb-4">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={14} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
            {title}
          </span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Hero value â€” strongest visual element */}
      <p
        className="text-[2.4rem] font-extrabold tabular-nums leading-none mb-1.5 transition-transform duration-[250ms] ease-out group-hover:scale-[1.015] origin-left"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
      >
        {value}
      </p>

      {/* Context */}
      <p className="text-[11px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
        {context}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto">
        {status && <StatusPill status={status} />}
        <p className="text-[10px] text-[var(--color-text-muted)] ml-auto">{footerText}</p>
      </div>
    </CardShell>
  );
}

// â”€â”€â”€ STANDARD variant â€” Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StandardCard({
  title, value, icon: Icon, accentHex = '#2563EB',
  context, trend, status, footerText, staggerClass,
}: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-4 pt-4 pb-3.5">
      {/* Top: icon row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={13} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
            {title}
          </span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Value */}
      <p
        className="text-[1.9rem] font-extrabold tabular-nums leading-none mb-1.5 transition-transform duration-[250ms] ease-out group-hover:scale-[1.01] origin-left"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}
      >
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

// â”€â”€â”€ STATUS variant â€” Health-focused â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusCard({
  title, value, icon: Icon, accentHex = '#2563EB',
  context, trend, status, footerText, staggerClass,
}: StatsCardProps) {
  return (
    <CardShell accentHex={accentHex} staggerClass={staggerClass} className="px-4 pt-4 pb-3.5">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <IconBadge Icon={Icon} accentHex={accentHex} size={13} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
            {title}
          </span>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Value â€” compact since status chip is the hero message */}
      <p
        className="text-[1.75rem] font-extrabold tabular-nums leading-none mb-2"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}
      >
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

// â”€â”€â”€ Public export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function StatsCard(props: StatsCardProps) {
  const { variant = 'standard' } = props;
  if (variant === 'primary') return <PrimaryCard {...props} />;
  if (variant === 'status')  return <StatusCard {...props} />;
  return <StandardCard {...props} />;
}
