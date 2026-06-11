import { cn } from '@/lib/utils';
import { TicketStatus, TenantStatus, PaymentStatus } from '@/types';

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  teal: 'bg-teal-100 text-teal-700',
};

type BadgeVariant = keyof typeof variants;

interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; }

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

const ticketColors: Record<TicketStatus, BadgeVariant> = {
  NEW_TICKET: 'info',
  ASSIGNED: 'warning',
  ACCEPTED: 'cyan',
  TRAVELLING: 'orange',
  REACHED_LOCATION: 'purple',
  IN_PROGRESS: 'purple',
  PENDING: 'warning',
  COMPLETED: 'success',
  INVOICE_GENERATED: 'teal',
  TICKET_CLOSED: 'default',
  CANCELLED: 'danger',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={ticketColors[status]}>{status.replace(/_/g, ' ')}</Badge>;
}

const tenantColors: Record<TenantStatus, BadgeVariant> = {
  ACTIVE: 'success', SUSPENDED: 'danger', EXPIRED: 'warning',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={tenantColors[status]}>{status}</Badge>;
}

const paymentColors: Record<PaymentStatus, BadgeVariant> = {
  PENDING: 'warning', COLLECTED: 'info', VERIFIED: 'success', FAILED: 'danger',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentColors[status]}>{status}</Badge>;
}
