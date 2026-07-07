import { cn } from '@/lib/utils';
import { TicketStatus, TenantStatus, PaymentStatus, UserRole } from '@/types';

const variants = {
  default:  { bg: 'bg-[var(--color-surface-elevated)]',        text: 'text-[var(--color-text-secondary)]',       dot: 'bg-[var(--color-surface-elevated)]' },
  success:  { bg: 'bg-[var(--color-surface-elevated)]',       text: 'text-emerald-700',     dot: 'bg-emerald-500' },
  warning:  { bg: 'bg-[var(--color-surface-elevated)]',         text: 'text-amber-700',       dot: 'bg-amber-500' },
  danger:   { bg: 'bg-[var(--color-surface-elevated)]',           text: 'text-red-700',         dot: 'bg-red-500' },
  info:     { bg: 'bg-[var(--color-surface-elevated)]',          text: 'text-blue-700',        dot: 'bg-blue-500' },
  purple:   { bg: 'bg-[var(--color-surface-elevated)]',        text: 'text-violet-700',      dot: 'bg-violet-500' },
  orange:   { bg: 'bg-orange-50',        text: 'text-orange-700',      dot: 'bg-orange-500' },
  cyan:     { bg: 'bg-cyan-50',          text: 'text-cyan-700',        dot: 'bg-cyan-500' },
  teal:     { bg: 'bg-[var(--color-surface-elevated)]',          text: 'text-teal-700',        dot: 'bg-teal-500' },
};

type BadgeVariant = keyof typeof variants;

interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; showDot?: boolean; }

export function Badge({ children, variant = 'default', className, showDot = true }: BadgeProps) {
  const v = variants[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        v.bg,
        v.text,
        // ring color derived from dot color (lighter)
        variant === 'success'  && 'ring-emerald-200',
        variant === 'warning'  && 'ring-amber-200',
        variant === 'danger'   && 'ring-red-200',
        variant === 'info'     && 'ring-blue-200',
        variant === 'purple'   && 'ring-violet-200',
        variant === 'orange'   && 'ring-orange-200',
        variant === 'cyan'     && 'ring-cyan-200',
        variant === 'teal'     && 'ring-teal-200',
        variant === 'default'  && 'ring-slate-200',
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', v.dot)} />}
      {children}
    </span>
  );
}

const ticketColors: Record<TicketStatus, BadgeVariant> = {
  NEW_TICKET:        'info',
  ASSIGNED:          'warning',
  ACCEPTED:          'cyan',
  TRAVELLING:        'orange',
  REACHED_LOCATION:  'purple',
  IN_PROGRESS:       'purple',
  PENDING:           'warning',
  COMPLETED:         'success',
  INVOICE_GENERATED: 'teal',
  TICKET_CLOSED:     'default',
  CANCELLED:         'danger',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={ticketColors[status]}>{status.replace(/_/g, ' ')}</Badge>;
}

const tenantColors: Record<TenantStatus, BadgeVariant> = {
  ACTIVE:          'success',
  SUSPENDED:       'danger',
  EXPIRED:         'warning',
  TRIAL:           'info',
  PAYMENT_PENDING: 'orange',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={tenantColors[status]}>{status.replace(/_/g, ' ')}</Badge>;
}

const planColors: Record<string, BadgeVariant> = {
  STARTER: 'info',
  PROFESSIONAL: 'purple',
  ENTERPRISE: 'success',
};

export function PlanBadge({ planName }: { planName?: string }) {
  if (!planName) {
    return <Badge variant="danger" showDot={false}>No Active Plan</Badge>;
  }
  const variant = planColors[planName.toUpperCase()] || 'default';
  return <Badge variant={variant} showDot={false}>{planName}</Badge>;
}

const paymentColors: Record<PaymentStatus, BadgeVariant> = {
  PENDING:   'warning',
  COLLECTED: 'info',
  VERIFIED:  'success',
  FAILED:    'danger',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentColors[status]}>{status}</Badge>;
}

const roleColors: Record<UserRole, BadgeVariant> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'teal',
  MANAGER: 'success',
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
  };
  return <Badge variant={roleColors[role]} showDot={false} className={className}>{roleLabels[role]}</Badge>;
}
