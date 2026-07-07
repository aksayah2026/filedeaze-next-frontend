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
import { Badge, PlanBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
  Search, Plus, RefreshCw, Eye, ArrowUpDown, Ban, CheckCircle,
  XCircle, AlertTriangle, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { FilterCard } from '@/components/ui/FilterCard';
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

type ComputedStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED' | 'QUEUED';

const STATUS_CFG: Record<ComputedStatus, { label: string; variant: string }> = {
  ACTIVE:        { label: 'Active',         variant: 'success' },
  EXPIRING_SOON: { label: 'Expiring Soon',  variant: 'warning' },
  EXPIRED:       { label: 'Expired',        variant: 'danger' },
  TRIAL:         { label: 'Trial',          variant: 'info' },
  SUSPENDED:     { label: 'Suspended',      variant: 'default' },
  CANCELLED:     { label: 'Cancelled',      variant: 'danger' },
  QUEUED:        { label: 'Queued',         variant: 'purple' },
};

function SubStatusBadge({ status }: { status: ComputedStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  return (
    <Badge variant={cfg.variant as any} showDot={false}>{cfg.label}</Badge>
  );
}



// ── Stat Card ──────────────────────────────────────────────────────────────────

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

function CreateModal({ onClose, plans, tenants, defaultTenantId }: { onClose: () => void; plans: Plan[]; tenants: Tenant[]; defaultTenantId?: string }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { tenantId: defaultTenantId ?? '', planId: '', billingCycle: 'YEARLY', paymentStatus: 'PAID', paymentMethod: 'UPI', notes: '', isTrial: false },
  });

  const watchedTenantId = watch('tenantId');
  const watchedPlanId   = watch('planId');
  const watchedCycle    = watch('billingCycle') as BillingCycle | '';
  const watchedTrial    = watch('isTrial');

  const selectedTenant  = tenants.find(t => t.id === watchedTenantId);
  const selectedPlan    = plans.find(p => p.id === watchedPlanId);
  const hasActiveSub    = selectedTenant?.subscription?.status === 'ACTIVE';
  const hasQueuedSub    = (selectedTenant?.subscription?.status as string) === 'QUEUED';
  const planHasDuration = !!(selectedPlan as any)?.durationDays;

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
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-blue-500" />
            <span>This tenant has an active subscription. The new subscription will be <strong>queued</strong> and activate automatically when the current one expires.</span>
          </div>
        )}

        {hasQueuedSub && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <span>This tenant already has a queued subscription. Cancel the queued subscription before adding a new one.</span>
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
            disabled={!!watchedTrial}
          />
        </div>

        {planHasDuration && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" {...register('isTrial')} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Trial — use plan duration <strong>({(selectedPlan as any).durationDays} days)</strong> instead of billing cycle
            </span>
          </label>
        )}

        {selectedPlan && watchedCycle && !watchedTrial && <PlanPreview plan={selectedPlan} cycle={watchedCycle} />}

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
          <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={hasQueuedSub}>
            <Plus size={14} /> {hasActiveSub ? 'Queue Subscription' : 'Create Subscription'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Renew Modal ────────────────────────────────────────────────────────────────

function RenewModal({ onClose, tenants, plans, defaultTenantId }: { onClose: () => void; tenants: Tenant[]; plans: Plan[]; defaultTenantId?: string }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { tenantId: defaultTenantId ?? '', planId: '', billingCycle: 'MONTHLY', paymentStatus: 'PAID', paymentMethod: 'UPI', notes: '' },
  });

  const watchedTenantId = watch('tenantId');
  const watchedPlanId   = watch('planId');
  const watchedCycle    = watch('billingCycle') as BillingCycle;

  const selectedTenant  = tenants.find(t => t.id === watchedTenantId);
  const existingSub     = selectedTenant?.subscription;
  const isExpired       = existingSub?.status === 'EXPIRED' || (existingSub?.endDate ? new Date(existingSub.endDate) < new Date() : false);
  const currentPlanId   = existingSub?.planId ?? '';
  const selectedPlan    = plans.find(p => p.id === (watchedPlanId || currentPlanId));
  const currentExpiry   = existingSub?.endDate ? dayjs(existingSub.endDate) : null;
  const renewBase       = isExpired ? dayjs() : currentExpiry;
  const newExpiry       = renewBase && watchedCycle ? renewBase.add(BILLING_CYCLES.find(b => b.value === watchedCycle)?.months ?? 1, 'month') : null;
  const remainingDays   = currentExpiry ? Math.max(0, currentExpiry.diff(dayjs(), 'day')) : 0;

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
      <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, planId: (d as any).planId || undefined, notes: (d as any).notes || undefined }))} className="space-y-4">

        <Select
          label="Tenant *"
          options={[{ value: '', label: 'Select Tenant...' }, ...tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` }))]}
          {...register('tenantId', { required: true })}
        />

        {watchedTenantId && !existingSub && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This tenant has no subscription to renew. Use <strong>Create Subscription</strong> instead.
          </p>
        )}

        {existingSub && (
          <>
            {/* Renewal Summary Card */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Renewal Summary</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-indigo-800">
                <div><p className="text-indigo-400">Tenant</p><p className="font-semibold">{selectedTenant?.companyName}</p></div>
                <div><p className="text-indigo-400">Current Plan</p><p className="font-semibold">{existingSub.plan?.name ?? '—'}</p></div>
                <div>
                  <p className="text-indigo-400">{isExpired ? 'Expired On' : 'Expires On'}</p>
                  <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
                    {currentExpiry?.format('DD MMM YYYY')}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-400">Days Remaining</p>
                  <p className={`font-semibold ${isExpired ? 'text-red-600' : remainingDays <= 7 ? 'text-amber-700' : 'text-indigo-900'}`}>
                    {isExpired ? 'Expired' : `${remainingDays}d`}
                  </p>
                </div>
                <div><p className="text-indigo-400">Amount</p><p className="font-semibold">₹{Number(selectedPlan?.price ?? existingSub.plan?.price ?? 0).toLocaleString()}/mo</p></div>
                <div>
                  <p className="text-indigo-400">New Expiry</p>
                  <p className="font-semibold text-emerald-700">{newExpiry?.format('DD MMM YYYY') ?? '—'}</p>
                </div>
              </div>
              <p className="text-[10px] text-indigo-500 border-t border-indigo-200 pt-2">
                {isExpired ? 'Expired — new period calculated from today.' : 'Active — expiry extends from current end date (not today).'}
              </p>
            </div>

            {/* Optional: upgrade/downgrade plan */}
            <Select
              label="Change Plan (optional)"
              options={[
                { value: '', label: `Keep current: ${existingSub.plan?.name ?? '—'}` },
                ...plans.filter(p => p.isActive && p.id !== currentPlanId).map(p => ({
                  value: p.id,
                  label: `${p.name} — ₹${Number(p.price).toLocaleString()}/mo`,
                })),
              ]}
              {...register('planId')}
            />

            {/* Billing Cycle */}
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Billing Cycle *</p>
              <div className="grid grid-cols-4 gap-2">
                {BILLING_CYCLES.map(c => (
                  <label key={c.value} className="cursor-pointer">
                    <input type="radio" className="sr-only peer" value={c.value} {...register('billingCycle', { required: true })} />
                    <div className="rounded-lg border border-[var(--color-border)] px-2 py-2 text-center text-xs font-medium text-[var(--color-text-secondary)] transition-colors peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white hover:border-[var(--color-primary)]">
                      {c.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

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

        <Input label="Notes (optional)" placeholder="e.g. Annual renewal — bank transfer" {...register('notes')} />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={!existingSub}>
            <RefreshCw size={14} /> Renew Subscription
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
    <Modal open onClose={onClose} title="Subscription Detail" size="lg">
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
          <div className="space-y-4 text-sm">
            {/* Tenant + status header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{sub.tenant.companyName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{sub.tenant.tenantCode}</p>
              </div>
              <div className="text-right">
                <SubStatusBadge status={sub.computedStatus as ComputedStatus} />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {sub.daysLeft > 0 ? `${sub.daysLeft}d remaining` : 'Expired'}
                </p>
              </div>
            </div>

            {/* Subscriptions table */}
            <div className="rounded-lg border border-[var(--color-border)] overflow-x-auto">
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                    {['Plan', 'Cycle', 'Start', 'End', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {/* Current subscription row */}
                  <tr className="bg-emerald-50/50">
                    <td className="px-3 py-2.5 font-semibold text-[var(--color-text-primary)]">{plan.name}</td>
                    <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">{cycleLabel(sub.billingCycle)}</td>
                    <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">{dayjs(sub.startDate).format('DD MMM YYYY')}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={sub.daysLeft <= 30 && sub.daysLeft > 0 ? 'text-amber-600 font-medium' : 'text-[var(--color-text-secondary)]'}>
                        {dayjs(sub.endDate).format('DD MMM YYYY')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">ACTIVE</span>
                    </td>
                  </tr>
                  {/* Queued subscription row */}
                  {(detail as any)?.queuedSubscription && (() => {
                    const q = (detail as any).queuedSubscription;
                    return (
                      <tr className="bg-amber-50/40">
                        <td className="px-3 py-2.5 font-semibold text-[var(--color-text-primary)]">{q.plan?.name ?? '—'}</td>
                        <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">{cycleLabel(q.billingCycle)}</td>
                        <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">{dayjs(q.startDate).format('DD MMM YYYY')}</td>
                        <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">{dayjs(q.endDate).format('DD MMM YYYY')}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">QUEUED</span>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Plan limits */}
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Managers',    plan.managerLimit   >= 99999 ? 'Unlimited' : plan.managerLimit],
                ['Technicians', plan.technicianLimit >= 99999 ? 'Unlimited' : plan.technicianLimit],
                ['Customers',   plan.customerLimit   >= 99999 ? 'Unlimited' : plan.customerLimit],
                ['Tickets',     plan.ticketLimit     >= 99999 ? 'Unlimited' : plan.ticketLimit],
                ['Storage',     `${plan.storageLimitGb} GB`],
                ['Pay Method',  sub.paymentMethod ?? '—'],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2">
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">{k}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{String(v)}</p>
                </div>
              ))}
            </div>

            {sub.notes && (
              <p className="text-xs text-[var(--color-text-muted)] italic border-t border-[var(--color-border)] pt-2">{sub.notes}</p>
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
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">

            {/* Queued subscription — shown at top */}
            {(detail as any)?.queuedSubscription && (() => {
              const q = (detail as any).queuedSubscription;
              return (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                      QUEUED
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">activates when current expires</span>
                  </div>
                  <div className="text-xs text-amber-900">
                    <span className="font-semibold">{q.plan?.name ?? '—'}</span>
                    {q.billingCycle && <span className="text-amber-700"> · {cycleLabel(q.billingCycle)}</span>}
                    <span className="text-amber-600"> · ₹{Number(q.plan?.price ?? 0).toLocaleString()}/mo</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    {dayjs(q.startDate).format('DD MMM YYYY')} → <strong>{dayjs(q.endDate).format('DD MMM YYYY')}</strong>
                  </p>
                </div>
              );
            })()}

            {/* History records */}
            {!detail?.subscriptionHistory?.length && !(detail as any)?.queuedSubscription ? (
              <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No history yet</p>
            ) : (detail?.subscriptionHistory ?? []).map((h: any) => {
              const actionColor: Record<string, string> = {
                CREATED: 'bg-emerald-100 text-emerald-700',
                RENEWED: 'bg-blue-100 text-blue-700',
                UPGRADED: 'bg-purple-100 text-purple-700',
                DOWNGRADED: 'bg-amber-100 text-amber-700',
                CANCELLED: 'bg-red-100 text-red-700',
              };
              return (
                <div key={h.id} className="rounded-lg border border-[var(--color-border)] px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${actionColor[h.action] ?? 'bg-gray-100 text-gray-700'}`}>
                      {h.action}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
                      ₹{Number(h.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium">{h.plan?.name ?? '—'}</span>
                    {h.billingCycle && <span className="text-[var(--color-text-muted)]"> · {cycleLabel(h.billingCycle)}</span>}
                  </div>
                  {h.previousEndDate ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {dayjs(h.previousEndDate).format('DD MMM YYYY')} → <strong className="text-emerald-700">{dayjs(h.newEndDate).format('DD MMM YYYY')}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Start: <strong>{dayjs(h.newEndDate).format('DD MMM YYYY')}</strong>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                    <span>{dayjs(h.createdAt).format('DD MMM YYYY, HH:mm')}</span>
                    {h.createdBy && <span>by {h.createdBy.name}</span>}
                  </div>
                  {h.notes && <p className="text-[10px] text-[var(--color-text-muted)] italic">{h.notes}</p>}
                </div>
              );
            })}
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

  const [showCreate,           setShowCreate]           = useState(false);
  const [showRenew,            setShowRenew]            = useState(false);
  const [showChangePlan,       setShowChangePlan]       = useState(false);
  const [showDetail,           setShowDetail]           = useState(false);
  const [activeSub,            setActiveSub]            = useState<SubscriptionWithMeta | null>(null);
  const [renewTenantId,        setRenewTenantId]        = useState<string | undefined>();
  const [createDefaultTenantId, setCreateDefaultTenantId] = useState<string | undefined>();

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Subscriptions</h2>
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

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {dashLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 animate-pulse">
              <div className="h-3 bg-[var(--color-surface-elevated)] rounded mb-2 w-2/3" />
              <div className="h-6 bg-[var(--color-surface-elevated)] rounded w-1/2" />
            </div>
          ))
        ) : dashboard ? [
          { label: 'Active',           value: dashboard.activeSubscriptions,                      dot: 'bg-emerald-500' },
          { label: 'Trial',            value: dashboard.trialSubscriptions,                       dot: 'bg-blue-500' },
          { label: 'Expiring Soon',    value: dashboard.expiringSoon,                             dot: 'bg-amber-500' },
          { label: 'Expired',          value: dashboard.expiredSubscriptions,                     dot: 'bg-red-500' },
          { label: 'Monthly Revenue',  value: `₹${dashboard.monthlyRevenue.toLocaleString()}`,   dot: 'bg-indigo-500' },
          { label: 'Annual Revenue',   value: `₹${dashboard.annualRevenue.toLocaleString()}`,    dot: 'bg-purple-500' },
          { label: 'Pending Renewals', value: dashboard.pendingRenewals,                          dot: 'bg-gray-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
            </div>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">{s.value}</p>
          </div>
        )) : null}
      </div>

      {/* Trial Tenants — pending activation */}
      {(() => {
        const trialTenants = tenants.filter((t: any) => t.status === 'TRIAL');
        if (!trialTenants.length) return null;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Trial Tenants ({trialTenants.length})</span>
                <span className="text-xs text-blue-600">— activate to convert to a paid subscription</span>
              </div>
            </div>
            <div className="divide-y divide-blue-100">
              {trialTenants.map((t: any) => {
                const trialEnd = t.trialEndsAt ? dayjs(t.trialEndsAt) : null;
                const dLeft = trialEnd ? trialEnd.diff(dayjs(), 'day') : null;
                const planName = t.plan?.name ?? t.selectedPlan?.name ?? '—';
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800 shrink-0">
                        {t.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-blue-900 truncate">{t.companyName}</p>
                        <p className="text-xs text-blue-600">{t.tenantCode} · Plan: {planName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {trialEnd && (
                        <div className="text-right">
                          <p className="text-xs text-blue-700 font-medium">
                            {dLeft !== null && dLeft >= 0 ? `${dLeft}d left` : 'Expired'}
                          </p>
                          <p className="text-xs text-blue-500">{trialEnd.format('DD MMM YYYY')}</p>
                        </div>
                      )}
                      <Button size="sm" onClick={() => { setCreateDefaultTenantId(t.id); setShowCreate(true); }}>
                        <CheckCircle size={12} /> Activate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <FilterCard
        title="Search & Filter"
        hideDateRange
        onApply={() => apply(1)}
        onReset={() => {
          setSearch('');
          setStatus('');
          setPlan('');
          setParams({ search: '', status: '', planId: '', page: 1 });
        }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Search</span>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              placeholder="Search tenant name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && apply(1)}
              className="w-52 rounded-[10px] border border-[var(--color-border-input)] bg-[var(--color-input-bg)] pl-8 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all h-10"
            />
          </div>
        </div>
        <Select label="Status" options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRING_SOON', label: 'Expiring Soon' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'CANCELLED', label: 'Cancelled' }]} value={statusFilter} onChange={e => setStatus(e.target.value)} className="w-40" />
        <Select label="Plan" options={[{ value: '', label: 'All Plans' }, ...plans.map(p => ({ value: p.id, label: p.name }))]} value={planFilter} onChange={e => setPlan(e.target.value)} className="w-36" />
      </FilterCard>

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
                        <PlanBadge planName={sub.plan.name} />
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
      {showCreate && <CreateModal onClose={() => { setShowCreate(false); setCreateDefaultTenantId(undefined); }} plans={plans} tenants={tenants} defaultTenantId={createDefaultTenantId} />}
      {showRenew  && <RenewModal  onClose={() => { setShowRenew(false); setRenewTenantId(undefined); }} tenants={tenants} plans={plans} defaultTenantId={renewTenantId} />}
      {showChangePlan && activeSub && <ChangePlanModal sub={activeSub} plans={plans} onClose={() => { setShowChangePlan(false); setActiveSub(null); }} />}
      {showDetail     && activeSub && <DetailModal     sub={activeSub}               onClose={() => { setShowDetail(false);     setActiveSub(null); }} />}
    </div>
  );
}
