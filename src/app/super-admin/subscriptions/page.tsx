'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  Plan, Tenant, SubscriptionWithMeta, SubscriptionDetail,
  SubscriptionDashboard, SubscriptionListResponse, BillingCycle, Billing,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Spinner';
import {
  Search, Plus, RefreshCw, Eye, ArrowUpDown, Ban, CheckCircle,
  XCircle, AlertTriangle, Clock, DollarSign, BarChart2,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import dayjs from 'dayjs';

// ── Constants ──────────────────────────────────────────────────────────────────

const BILLING_CYCLES: { value: BillingCycle; label: string; months: number }[] = [
  { value: 'MONTHLY',     label: 'Monthly',     months: 1  },
  { value: 'QUARTERLY',   label: 'Quarterly',   months: 3  },
  { value: 'HALF_YEARLY', label: 'Half-Yearly', months: 6  },
  { value: 'YEARLY',      label: 'Yearly',      months: 12 },
];
const PAYMENT_METHODS = ['UPI', 'BANK_TRANSFER', 'CASH', 'ONLINE', 'OTHER'];

function cycleLabel(c: string) {
  return BILLING_CYCLES.find(b => b.value === c)?.label ?? c;
}

function calcEndFromNow(cycle: BillingCycle): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + (BILLING_CYCLES.find(b => b.value === cycle)?.months ?? 12));
  return d;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

type ComputedStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';

const STATUS_CFG: Record<ComputedStatus, { label: string; cls: string }> = {
  ACTIVE:        { label: 'Active',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRING_SOON: { label: 'Expiring Soon',  cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  EXPIRED:       { label: 'Expired',        cls: 'bg-red-50    text-red-700    border-red-200'    },
  TRIAL:         { label: 'Trial',          cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  SUSPENDED:     { label: 'Suspended',      cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
  CANCELLED:     { label: 'Cancelled',      cls: 'bg-red-50    text-red-400    border-red-100'    },
};

function SubStatusBadge({ status }: { status: ComputedStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function deriveStatus(status: string, endDate: string): ComputedStatus {
  if (status !== 'ACTIVE') return status as ComputedStatus;
  const d = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  if (d < 0) return 'EXPIRED';
  if (d <= 7) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, cls }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; cls: string;
}) {
  return (
    <div className={`rounded-xl border p-3.5 flex items-start gap-3 ${cls}`}>
      <div className="p-1.5 rounded-lg bg-white/60 shrink-0"><Icon size={15} /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-70 truncate">{label}</p>
        <p className="text-lg font-bold tabular-nums mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs opacity-55 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Plan Preview ───────────────────────────────────────────────────────────────

function PlanPreview({ plan, cycle }: { plan: Plan; cycle: BillingCycle | '' }) {
  const months = BILLING_CYCLES.find(b => b.value === cycle)?.months ?? 12;
  const total = Number(plan.price) * months;
  const endDate = cycle ? calcEndFromNow(cycle as BillingCycle) : null;
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-indigo-900 text-base">{plan.name}</p>
          <p className="text-indigo-600 text-xs">₹{Number(plan.price).toLocaleString()} / month</p>
        </div>
        {cycle && (
          <div className="text-right">
            <p className="text-xs text-indigo-500">Total ({cycleLabel(cycle)})</p>
            <p className="font-bold text-indigo-800">₹{total.toLocaleString()}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-indigo-800">
        {[
          ['Managers',    plan.managerLimit   >= 99999 ? 'Unlimited' : plan.managerLimit],
          ['Technicians', plan.technicianLimit >= 99999 ? 'Unlimited' : plan.technicianLimit],
          ['Customers',   plan.customerLimit   >= 99999 ? 'Unlimited' : plan.customerLimit],
          ['Tickets',     plan.ticketLimit     >= 99999 ? 'Unlimited' : plan.ticketLimit],
          ['Storage',     `${plan.storageLimitGb} GB`],
          ['Ends',        endDate ? dayjs(endDate).format('DD MMM YYYY') : '—'],
        ].map(([k, v]) => (
          <span key={String(k)}>{k}: <strong>{String(v)}</strong></span>
        ))}
      </div>
    </div>
  );
}

// ── Action Button ──────────────────────────────────────────────────────────────

function Btn({ children, title, onClick, loading, danger }: {
  children: React.ReactNode; title: string; onClick: () => void; loading?: boolean; danger?: boolean;
}) {
  return (
    <button
      title={title} onClick={onClick} disabled={loading}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${danger
        ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-secondary)]'
      }`}
    >
      {children}
    </button>
  );
}

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose, plans, tenants }: { onClose: () => void; plans: Plan[]; tenants: Tenant[] }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { tenantId: '', planId: '', billingCycle: 'YEARLY', paymentStatus: 'PAID', paymentMethod: 'UPI', notes: '' },
  });

  const watchedTenantId = watch('tenantId');
  const watchedPlanId   = watch('planId');
  const watchedCycle    = watch('billingCycle') as BillingCycle | '';

  const selectedTenant = tenants.find(t => t.id === watchedTenantId);
  const selectedPlan   = plans.find(p => p.id === watchedPlanId);
  const hasActiveSub   = selectedTenant?.subscription?.status === 'ACTIVE';

  const mutation = useMutation({
    mutationFn: (d: object) => api.post('/web/super-admin/subscriptions', d),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Subscription created');
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['subscription-dashboard'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      reset(); onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create subscription'),
  });

  return (
    <Modal open onClose={onClose} title="Create Subscription" size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <Select
          label="Tenant *"
          options={[{ value: '', label: 'Select Tenant...' }, ...tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` }))]}
          {...register('tenantId', { required: 'Select a tenant' })}
          error={errors.tenantId?.message as string}
        />

        {hasActiveSub && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <span>This tenant already has an active subscription. Please renew or change the existing subscription.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Plan *"
            options={[{ value: '', label: 'Select Plan...' }, ...plans.filter(p => p.isActive).map(p => ({ value: p.id, label: `${p.name} — ₹${Number(p.price).toLocaleString()}/mo` }))]}
            {...register('planId', { required: 'Select a plan' })}
            error={errors.planId?.message as string}
          />
          <Select
            label="Billing Cycle *"
            options={BILLING_CYCLES.map(c => ({ value: c.value, label: c.label }))}
            {...register('billingCycle', { required: true })}
          />
        </div>

        {selectedPlan && watchedCycle && <PlanPreview plan={selectedPlan} cycle={watchedCycle} />}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment Status *"
            options={[{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }]}
            {...register('paymentStatus', { required: true })}
          />
          <Select
            label="Payment Method"
            options={[{ value: '', label: 'None' }, ...PAYMENT_METHODS.map(m => ({ value: m, label: m.replace('_', ' ') }))]}
            {...register('paymentMethod')}
          />
        </div>

        <Input label="Notes (optional)" placeholder="e.g. Annual deal, paid via bank transfer" {...register('notes')} />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={hasActiveSub}>
            <Plus size={14} /> Create Subscription
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Renew Modal ────────────────────────────────────────────────────────────────

function RenewModal({ onClose, tenants, defaultTenantId }: { onClose: () => void; tenants: Tenant[]; defaultTenantId?: string }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { tenantId: defaultTenantId ?? '', billingCycle: 'YEARLY', paymentStatus: 'PAID', paymentMethod: 'UPI' },
  });

  const watchedTenantId = watch('tenantId');
  const watchedCycle    = watch('billingCycle') as BillingCycle;

  const selectedTenant = tenants.find(t => t.id === watchedTenantId);
  const activeSub      = selectedTenant?.subscription;
  const currentExpiry  = activeSub?.endDate ? dayjs(activeSub.endDate) : null;
  const newExpiry      = currentExpiry && watchedCycle
    ? currentExpiry.add(BILLING_CYCLES.find(b => b.value === watchedCycle)?.months ?? 12, 'month')
    : null;

  const mutation = useMutation({
    mutationFn: (d: object) => api.post('/web/super-admin/subscriptions/renew', d),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Renewed successfully');
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['subscription-dashboard'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to renew'),
  });

  return (
    <Modal open onClose={onClose} title="Renew Subscription" size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <Select
          label="Tenant *"
          options={[{ value: '', label: 'Select Tenant...' }, ...tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` }))]}
          {...register('tenantId', { required: true })}
        />

        {watchedTenantId && !activeSub && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This tenant has no active subscription to renew.
          </p>
        )}

        {activeSub && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-xs space-y-1.5">
            <p className="font-semibold text-[var(--color-text-primary)]">Current Subscription</p>
            <p className="text-[var(--color-text-secondary)]">Plan: <strong>{activeSub.plan?.name ?? '—'}</strong></p>
            <p className="text-[var(--color-text-secondary)]">Expires: <strong className="text-amber-700">{currentExpiry?.format('DD MMM YYYY')}</strong></p>
            {newExpiry && <p className="text-[var(--color-text-secondary)]">New Expiry: <strong className="text-emerald-700">{newExpiry.format('DD MMM YYYY')}</strong></p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Billing Cycle *"
            options={BILLING_CYCLES.map(c => ({ value: c.value, label: c.label }))}
            {...register('billingCycle', { required: true })}
          />
          <Select
            label="Payment Status *"
            options={[{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }]}
            {...register('paymentStatus', { required: true })}
          />
        </div>
        <Select
          label="Payment Method"
          options={[{ value: '', label: 'None' }, ...PAYMENT_METHODS.map(m => ({ value: m, label: m.replace('_', ' ') }))]}
          {...register('paymentMethod')}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={!activeSub}>
            <RefreshCw size={14} /> Renew
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Change Plan Modal ──────────────────────────────────────────────────────────

function ChangePlanModal({ sub, plans, onClose }: { sub: SubscriptionWithMeta; plans: Plan[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [planId, setPlanId] = useState('');
  const selectedPlan = plans.find(p => p.id === planId);

  const mutation = useMutation({
    mutationFn: () => api.patch(`/web/super-admin/subscriptions/${sub.id}/change-plan`, { planId }),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Plan changed');
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['subscription-dashboard'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal open onClose={onClose} title="Change Plan" size="sm">
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-sm">
          <p className="text-xs text-[var(--color-text-muted)]">Current Plan</p>
          <p className="font-bold text-[var(--color-text-primary)] mt-0.5">{sub.plan.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">₹{Number(sub.plan.price).toLocaleString()}/mo · Ends {dayjs(sub.endDate).format('DD MMM YYYY')}</p>
        </div>

        <Select
          label="New Plan *"
          options={[
            { value: '', label: 'Select new plan...' },
            ...plans.filter(p => p.isActive && p.id !== sub.planId).map(p => ({ value: p.id, label: `${p.name} — ₹${Number(p.price).toLocaleString()}/mo` })),
          ]}
          value={planId}
          onChange={e => setPlanId(e.target.value)}
        />

        {selectedPlan && <PlanPreview plan={selectedPlan} cycle="" />}

        {selectedPlan && (
          <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2 border border-[var(--color-border)]">
            Limits update immediately. Subscription end date is unchanged.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} disabled={!planId} onClick={() => mutation.mutate()}>
            <ArrowUpDown size={14} /> Change Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function DetailModal({ sub, onClose }: { sub: SubscriptionWithMeta; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'billing' | 'history'>('overview');

  const { data: detail, isLoading } = useQuery<SubscriptionDetail>({
    queryKey: ['subscription-detail', sub.id],
    queryFn: async () => (await api.get(`/web/super-admin/subscriptions/${sub.id}`)).data.data,
  });

  const plan = detail?.plan ?? sub.plan;

  return (
    <Modal open onClose={onClose} title="Subscription Detail" size="sm">
      <div className="space-y-4">
        <div className="flex border-b border-[var(--color-border)] gap-5 text-sm">
          {(['overview', 'billing', 'history'] as const).map(t => (
            <button
              key={t}
              className={`pb-2 font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
              onClick={() => setTab(t)}
            >
              {t === 'history' ? 'Sub. History' : t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-5 bg-[var(--color-surface-elevated)] rounded animate-pulse" />)}
          </div>
        ) : tab === 'overview' ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <SubStatusBadge status={sub.computedStatus as ComputedStatus} />
              <span className="text-xs text-[var(--color-text-muted)]">
                {sub.daysLeft > 0 ? `${sub.daysLeft} days remaining` : 'Expired'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[var(--color-text-secondary)]">
              {[
                ['Tenant',        sub.tenant.companyName],
                ['Plan',          plan.name],
                ['Price',         `₹${Number(plan.price).toLocaleString()}/mo`],
                ['Billing Cycle', cycleLabel(sub.billingCycle)],
                ['Start Date',    dayjs(sub.startDate).format('DD MMM YYYY')],
                ['End Date',      dayjs(sub.endDate).format('DD MMM YYYY')],
                ['Managers',      plan.managerLimit   >= 99999 ? 'Unlimited' : plan.managerLimit],
                ['Technicians',   plan.technicianLimit >= 99999 ? 'Unlimited' : plan.technicianLimit],
                ['Customers',     plan.customerLimit   >= 99999 ? 'Unlimited' : plan.customerLimit],
                ['Tickets',       plan.ticketLimit     >= 99999 ? 'Unlimited' : plan.ticketLimit],
                ['Storage',       `${plan.storageLimitGb} GB`],
                ['Pay Method',    sub.paymentMethod ?? '—'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <p className="text-xs text-[var(--color-text-muted)]">{k}</p>
                  <p className="font-medium">{String(v)}</p>
                </div>
              ))}
            </div>
            {sub.notes && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Notes</p>
                <p className="text-sm">{sub.notes}</p>
              </div>
            )}
          </div>
        ) : tab === 'billing' ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {!detail?.billings?.length ? (
              <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No billing records</p>
            ) : detail.billings.map((b: Billing) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm">
                <div>
                  <p className="font-mono text-xs text-[var(--color-text-muted)]">{b.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{dayjs(b.createdAt).format('DD MMM YYYY')}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-semibold tabular-nums">₹{Number(b.amount).toLocaleString()}</p>
                  <Badge variant={b.status === 'PAID' ? 'success' : 'warning'}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {!detail?.subscriptionHistory?.length ? (
              <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No history</p>
            ) : detail.subscriptionHistory.map((s: any) => (
              <div key={s.id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${s.id === sub.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)]'}`}>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{s.plan?.name ?? '—'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {dayjs(s.startDate).format('DD MMM YYYY')} → {dayjs(s.endDate).format('DD MMM YYYY')}
                  </p>
                </div>
                <div className="text-right">
                  <SubStatusBadge status={deriveStatus(s.status, s.endDate)} />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{cycleLabel(s.billingCycle ?? 'YEARLY')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const qc = useQueryClient();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [planFilter, setPlan]         = useState('');
  const [params, setParams]           = useState({ search: '', status: '', planId: '', page: 1 });

  const [showCreate,     setShowCreate]     = useState(false);
  const [showRenew,      setShowRenew]      = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showDetail,     setShowDetail]     = useState(false);
  const [activeSub,      setActiveSub]      = useState<SubscriptionWithMeta | null>(null);
  const [renewTenantId,  setRenewTenantId]  = useState<string | undefined>();

  const { data: dashboard, isLoading: dashLoading } = useQuery<SubscriptionDashboard>({
    queryKey: ['subscription-dashboard'],
    queryFn: async () => (await api.get('/web/super-admin/subscriptions/dashboard')).data.data,
    staleTime: 30_000,
  });

  const { data: listData, isLoading: listLoading, isError } = useQuery<SubscriptionListResponse>({
    queryKey: ['subscriptions', params],
    queryFn: async () => (await api.get('/web/super-admin/subscriptions', {
      params: Object.fromEntries(Object.entries({ ...params, limit: 20 }).filter(([, v]) => v !== '' && v !== 0)),
    })).data.data,
  });

  const { data: plans = [] }   = useQuery<Plan[]>({   queryKey: ['plans'],   queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,   staleTime: 60_000 });
  const { data: tenants = [] } = useQuery<Tenant[]>({ queryKey: ['tenants'], queryFn: async () => (await api.get('/web/super-admin/tenants')).data.data, staleTime: 60_000 });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/web/super-admin/subscriptions/${id}/cancel`),
    onSuccess: () => { toast.success('Subscription cancelled'); qc.invalidateQueries({ queryKey: ['subscriptions'] }); qc.invalidateQueries({ queryKey: ['subscription-dashboard'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });
  const suspendMutation = useMutation({
    mutationFn: (tid: string) => api.patch(`/web/super-admin/tenants/${tid}/status`, { status: 'SUSPENDED' }),
    onSuccess: () => { toast.success('Tenant suspended'); qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
    onError: () => toast.error('Failed to suspend'),
  });
  const activateMutation = useMutation({
    mutationFn: (tid: string) => api.patch(`/web/super-admin/tenants/${tid}/status`, { status: 'ACTIVE' }),
    onSuccess: () => { toast.success('Tenant activated'); qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
    onError: () => toast.error('Failed to activate'),
  });

  const subs = listData?.subscriptions ?? [];
  const totalPages = listData?.totalPages ?? 1;
  const totalCount = listData?.total ?? 0;

  function apply(page = 1) {
    setParams({ search, status: statusFilter, planId: planFilter, page });
  }

  function openRenew(sub?: SubscriptionWithMeta) {
    setRenewTenantId(sub?.tenantId);
    setShowRenew(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Subscription Management</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Manage tenant subscriptions, plans, and billing cycles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openRenew()}>
            <RefreshCw size={13} /> Renew
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={13} /> Create Subscription
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={CheckCircle}   label="Active"             value={dashboard.activeSubscriptions}                         cls="bg-emerald-50 border-emerald-200 text-emerald-900" />
          <StatCard icon={Users}         label="Trial"              value={dashboard.trialSubscriptions}                          cls="bg-blue-50 border-blue-200 text-blue-900" />
          <StatCard icon={Clock}         label="Expiring This Week" value={dashboard.expiringSoon}                                cls="bg-amber-50 border-amber-200 text-amber-900" />
          <StatCard icon={AlertTriangle} label="Expired"            value={dashboard.expiredSubscriptions}                        cls="bg-red-50 border-red-200 text-red-900" />
          <StatCard icon={DollarSign}    label="Monthly Revenue"    value={`₹${dashboard.monthlyRevenue.toLocaleString()}`}      cls="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
          <StatCard icon={BarChart2}     label="Annual Revenue"     value={`₹${dashboard.annualRevenue.toLocaleString()}`}       cls="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
          <StatCard icon={RefreshCw}     label="Pending Renewals"   value={dashboard.pendingRenewals}                            cls="bg-indigo-50 border-indigo-200 text-indigo-900" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Input placeholder="Search tenant name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && apply(1)} />
        </div>
        <Select
          options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRING_SOON', label: 'Expiring Soon' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'CANCELLED', label: 'Cancelled' }]}
          value={statusFilter} onChange={e => setStatus(e.target.value)} className="w-40"
        />
        <Select
          options={[{ value: '', label: 'All Plans' }, ...plans.map(p => ({ value: p.id, label: p.name }))]}
          value={planFilter} onChange={e => setPlan(e.target.value)} className="w-36"
        />
        <Button onClick={() => apply(1)}><Search size={14} /> Apply</Button>
      </div>

      {/* Table */}
      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">Failed to load subscriptions.</div>
      ) : (
        <>
          {!listLoading && totalCount > 0 && (
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>{totalCount} subscription{totalCount !== 1 ? 's' : ''}</span>
              {totalPages > 1 && <span>Page {params.page} of {totalPages}</span>}
            </div>
          )}

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                    {['Tenant', 'Plan', 'Cycle', 'Status', 'Start', 'Expires', 'Days', 'Price/mo', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {listLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--color-surface-elevated)] rounded animate-pulse" /></td>)}</tr>
                    ))
                  ) : subs.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-14 text-center text-[var(--color-text-muted)] text-sm">No subscriptions found. Create one to get started.</td></tr>
                  ) : subs.map(sub => (
                    <tr key={sub.id} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                            {sub.tenant.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{sub.tenant.companyName}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{sub.tenant.tenantCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{sub.plan.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{cycleLabel(sub.billingCycle)}</td>
                      <td className="px-4 py-3"><SubStatusBadge status={sub.computedStatus as ComputedStatus} /></td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{dayjs(sub.startDate).format('DD MMM YYYY')}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className={sub.daysLeft <= 7 ? 'text-red-600 font-medium' : sub.daysLeft <= 30 ? 'text-amber-600 font-medium' : 'text-[var(--color-text-secondary)]'}>
                          {dayjs(sub.endDate).format('DD MMM YYYY')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className={`font-semibold tabular-nums ${sub.daysLeft <= 7 ? 'text-red-600' : sub.daysLeft <= 30 ? 'text-amber-600' : 'text-[var(--color-text-secondary)]'}`}>
                          {sub.computedStatus === 'EXPIRED' || sub.computedStatus === 'CANCELLED' ? '—' : `${sub.daysLeft}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-[var(--color-text-secondary)] whitespace-nowrap">
                        ₹{Number(sub.plan.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Btn title="View Detail" onClick={() => { setActiveSub(sub); setShowDetail(true); }}><Eye size={13} /></Btn>
                          {sub.status === 'ACTIVE' && <>
                            <Btn title="Renew" onClick={() => openRenew(sub)}><RefreshCw size={13} /></Btn>
                            <Btn title="Change Plan" onClick={() => { setActiveSub(sub); setShowChangePlan(true); }}><ArrowUpDown size={13} /></Btn>
                          </>}
                          {sub.tenant.status === 'ACTIVE' && sub.status === 'ACTIVE' && (
                            <Btn title="Suspend Tenant" onClick={() => suspendMutation.mutate(sub.tenantId)} loading={suspendMutation.isPending} danger><Ban size={13} /></Btn>
                          )}
                          {sub.tenant.status === 'SUSPENDED' && (
                            <Btn title="Activate Tenant" onClick={() => activateMutation.mutate(sub.tenantId)} loading={activateMutation.isPending}><CheckCircle size={13} /></Btn>
                          )}
                          {sub.status !== 'CANCELLED' && (
                            <Btn title="Cancel Subscription" onClick={() => { if (window.confirm('Cancel this subscription? The tenant will lose access.')) cancelMutation.mutate(sub.id); }} loading={cancelMutation.isPending} danger>
                              <XCircle size={13} />
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!listLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-40" disabled={params.page <= 1} onClick={() => apply(params.page - 1)}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = params.page <= 4 ? i + 1 : params.page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return <button key={p} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === params.page ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]'}`} onClick={() => apply(p)}>{p}</button>;
              })}
              <button className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-40" disabled={params.page >= totalPages} onClick={() => apply(params.page + 1)}><ChevronRight size={14} /></button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} plans={plans} tenants={tenants} />}
      {showRenew  && <RenewModal  onClose={() => { setShowRenew(false); setRenewTenantId(undefined); }} tenants={tenants} defaultTenantId={renewTenantId} />}
      {showChangePlan && activeSub && <ChangePlanModal sub={activeSub} plans={plans} onClose={() => { setShowChangePlan(false); setActiveSub(null); }} />}
      {showDetail     && activeSub && <DetailModal     sub={activeSub}               onClose={() => { setShowDetail(false);     setActiveSub(null); }} />}
    </div>
  );
}
