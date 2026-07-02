'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/lib/axios';
import { Tenant, TenantStatus, Plan, Billing } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, TenantStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import dayjs from 'dayjs';
import { Users, CreditCard, Calendar, Download, QrCode, Building2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showQr, setShowQr] = useState(false);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => (await api.get(`/web/super-admin/tenants/${id}`)).data.data,
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,
  });

  const { data: billings = [] } = useQuery<Billing[]>({
    queryKey: ['tenant-billings', id],
    queryFn: async () => {
      const res = await api.get(`/web/super-admin/billing`, { params: { tenantId: id } });
      const d = res.data.data;
      return Array.isArray(d) ? d : (d?.billings ?? d?.items ?? []);
    },
  });

  const { data: tenantSubs = [] } = useQuery<any[]>({
    queryKey: ['tenant-subscriptions', id],
    queryFn: async () => {
      const res = await api.get('/web/super-admin/subscriptions', { params: { tenantId: id, limit: 50 } });
      return res.data.data?.subscriptions ?? [];
    },
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Tenant>>();

  useEffect(() => {
    if (tenant) reset({ companyName: tenant.companyName, email: tenant.email, phone: tenant.phone, address: tenant.address });
  }, [tenant, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => api.patch(`/web/super-admin/tenants/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Tenant updated'); },
    onError: () => toast.error('Update failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TenantStatus) => api.patch(`/web/super-admin/tenants/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed'),
  });

  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => api.patch(`/web/super-admin/tenants/${id}/plan`, { planId }),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: ['tenant', id] });
      const planName = plans.find(p => p.id === planId)?.name ?? 'plan';
      toast.success(`Plan changed to ${planName}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to change plan'),
  });

  const billingColumns: ColumnDef<Billing, unknown>[] = [
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-semibold text-[var(--color-text-primary)]">₹{row.original.amount.toLocaleString()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Billed On',
      cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY'),
    },
    {
      accessorKey: 'paidAt',
      header: 'Paid At',
      cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—',
    },
  ];

  if (isLoading || !tenant) return <PageSpinner />;

  const planOptions = plans.map(p => ({ value: p.id, label: `${p.name} — ₹${p.price}` }));
  const currentPlan = tenant.subscription?.plan ?? tenant.selectedPlan ?? null;
  const currentPlanId = tenant.subscription?.planId ?? tenant.selectedPlanId ?? '';

  const upiQrString = currentPlan
    ? `upi://pay?pa=fieldeaze@upi&pn=FieldEaze&am=${currentPlan.price}&tn=${tenant.tenantCode}-subscription&cu=INR`
    : '';

  function downloadQr() {
    const canvas = document.querySelector('#tenant-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${tenant!.tenantCode}-payment-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  const initials = tenant.companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const statusButtons: { status: TenantStatus; label: string; activeColor: string }[] = [
    { status: 'ACTIVE',    label: 'Active',    activeColor: 'bg-emerald-600 text-white border-emerald-600' },
    { status: 'SUSPENDED', label: 'Suspended', activeColor: 'bg-red-600 text-white border-red-600' },
    { status: 'EXPIRED',   label: 'Expired',   activeColor: 'bg-amber-500 text-white border-amber-500' },
    { status: 'TRIAL',     label: 'Trial',     activeColor: 'bg-blue-600 text-white border-blue-600' },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back link */}
      <Link
        href="/super-admin/tenants"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        <ChevronLeft size={14} />
        Back to Tenants
      </Link>

      {/* Tenant Profile Header */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{tenant.companyName}</h2>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--color-text-muted)] flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                <code className="font-mono">{tenant.tenantCode}</code>
              </span>
              <span>{tenant.email}</span>
              {tenant.phone && <span>{tenant.phone}</span>}
            </div>
            {(tenant.adminName || tenant.adminEmail) && (
              <div className="flex items-center gap-4 mt-1 text-xs flex-wrap">
                <span className="text-[var(--color-text-muted)]">Admin:</span>
                {tenant.adminName && <span className="font-medium text-[var(--color-text-secondary)]">{tenant.adminName}</span>}
                {tenant.adminEmail && <span className="text-[var(--color-text-muted)]">{tenant.adminEmail}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
              <CreditCard size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Current Plan</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {currentPlan?.name ?? '—'}
                {!tenant.subscription && tenant.selectedPlan && (
                  <span className="ml-1.5 text-xs font-normal text-amber-500">(trial)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
              <Calendar size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sub. End</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {tenant.subscription?.endDate ? dayjs(tenant.subscription.endDate).format('DD MMM YYYY') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
              <Users size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Billing Records</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{billings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Details */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Edit Details</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" {...register('companyName')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Address" {...register('address')} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={isSubmitting}>Save Changes</Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Status */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-amber-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Change Status</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {statusButtons.map(({ status, label, activeColor }) => (
              <button
                key={status}
                onClick={() => statusMutation.mutate(status)}
                disabled={statusMutation.isPending}
                className={cn(
                  'px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-150',
                  tenant.status === status
                    ? activeColor
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Change Plan */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-violet-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Change Plan</h3>
        </div>
        <div className="p-6">
          <div className="flex gap-3 items-end flex-wrap">
            <Select
              label="Select Plan"
              options={planOptions}
              value={currentPlanId}
              onChange={e => changePlanMutation.mutate(e.target.value)}
              className="w-64"
            />
            {changePlanMutation.isPending && (
              <p className="text-xs text-[var(--color-text-muted)] pb-2">Updating…</p>
            )}
          </div>
          {!tenant.subscription && (
            <p className="mt-3 text-xs text-amber-600 bg-[var(--color-surface-elevated)] border border-amber-100 rounded-lg px-3 py-2">
              This tenant is on a trial. Changing the plan updates what they will pay when they subscribe.
            </p>
          )}
        </div>
      </div>

      {/* Payment QR */}
      {currentPlan && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-violet-500" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <QrCode size={15} className="text-violet-500" /> Payment QR
              </h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowQr(v => !v)}>
                {showQr ? 'Hide QR' : 'Generate QR'}
              </Button>
              {showQr && (
                <Button size="sm" variant="secondary" onClick={downloadQr}>
                  <Download size={13} /> Download
                </Button>
              )}
            </div>
          </div>
          {showQr && (
            <div className="p-6 flex flex-col sm:flex-row gap-6 items-start animate-fe-fade-in">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm">
                  <QRCodeCanvas
                    id="tenant-qr-canvas"
                    value={upiQrString}
                    size={150}
                    level="M"
                    marginSize={2}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Scan to pay via UPI</p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Plan', value: currentPlan.name },
                  { label: 'Amount', value: `₹${Number(currentPlan.price).toLocaleString()}`, bold: true },
                  { label: 'Tenant', value: tenant.companyName },
                ].map(({ label, value, bold }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
                    <p className={cn('text-[var(--color-text-primary)]', bold ? 'text-xl font-bold' : 'font-semibold')}>{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">UPI String</p>
                  <p className="font-mono text-xs text-[var(--color-text-muted)] break-all max-w-xs bg-[var(--color-surface-elevated)] p-2 rounded-lg">{upiQrString}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription History Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Subscriptions</h3>
          {tenantSubs.length > 0 && (
            <span className="ml-auto text-xs text-[var(--color-text-muted)]">{tenantSubs.length} record{tenantSubs.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          {tenantSubs.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                {tenant.subscription ? 'Loading...' : 'No subscriptions yet.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                  {['Plan Name', 'Billing Cycle', 'Start Date', 'End Date', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {tenantSubs.map((s: any) => {
                  const statusStyle: Record<string, string> = {
                    ACTIVE:    'bg-emerald-100 text-emerald-700',
                    EXPIRED:   'bg-gray-100 text-gray-500',
                    CANCELLED: 'bg-red-100 text-red-600',
                    QUEUED:    'bg-amber-100 text-amber-700',
                    TRIAL:     'bg-blue-100 text-blue-700',
                  };
                  const cycleMap: Record<string, string> = {
                    MONTHLY: 'Monthly', QUARTERLY: 'Quarterly',
                    HALF_YEARLY: 'Half-Yearly', YEARLY: 'Yearly',
                  };
                  const daysLeft = s.endDate ? Math.max(0, dayjs(s.endDate).diff(dayjs(), 'day')) : 0;
                  const isActive = s.status === 'ACTIVE';
                  return (
                    <tr key={s.id} className={`transition-colors ${isActive ? 'bg-emerald-50/40' : 'hover:bg-[var(--color-surface-elevated)]'}`}>
                      <td className="px-5 py-3 font-medium text-[var(--color-text-primary)]">
                        {s.plan?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {cycleMap[s.billingCycle] ?? s.billingCycle ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {dayjs(s.startDate).format('DD MMM YYYY')}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={isActive && daysLeft <= 30 ? 'text-amber-600 font-medium' : 'text-[var(--color-text-secondary)]'}>
                          {dayjs(s.endDate).format('DD MMM YYYY')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyle[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-[var(--color-surface-elevated)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Billing History</h3>
        </div>
        <div className="p-6">
          {billings.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No billing records found.</p>
          ) : (
            <DataTable data={billings} columns={billingColumns} isLoading={false} />
          )}
        </div>
      </div>
    </div>
  );
}
