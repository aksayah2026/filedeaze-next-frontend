'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Billing, BillingReport, Tenant, PlatformUpi } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Search, CheckCircle, QrCode, TrendingUp, Clock } from 'lucide-react';
import { FilterCard } from '@/components/ui/FilterCard';
import dayjs from 'dayjs';

export default function BillingPage() {
  const qc = useQueryClient();
  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [params, setParams] = useState({ tenantId: '', status: '', from: '', to: '' });

  const { data, isLoading } = useQuery<BillingReport>({
    queryKey: ['billing', params],
    queryFn: async () => (await api.get('/web/super-admin/billing', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants-list'],
    queryFn: async () => (await api.get('/web/super-admin/tenants')).data.data,
    staleTime: 60_000,
  });

  const { data: upiData } = useQuery<PlatformUpi>({
    queryKey: ['platform-upi'],
    queryFn: async () => (await api.get('/web/super-admin/platform-upi')).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PlatformUpi>();
  useEffect(() => { if (upiData) reset(upiData); }, [upiData, reset]);

  const upiMutation = useMutation({
    mutationFn: (d: PlatformUpi) => api.patch('/web/super-admin/platform-upi', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform-upi'] }); toast.success('UPI settings saved'); },
    onError: () => toast.error('Failed to save UPI settings'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/web/super-admin/billing/${id}/mark-paid`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing'] }); toast.success('Marked as paid'); },
    onError: () => toast.error('Failed'),
  });

  const tenantOptions = [
    { value: '', label: 'All Tenants' },
    ...tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` })),
  ];

  const columns: ColumnDef<Billing, unknown>[] = [
    {
      id: 'ref',
      header: 'Ref',
      cell: ({ row }) => (
        <code className="text-[11px] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded font-mono">
          {row.original.id.slice(0, 8).toUpperCase()}
        </code>
      ),
    },
    {
      accessorKey: 'tenant.companyName',
      header: 'Tenant',
      cell: ({ row }) => (
        <span className="font-medium text-[var(--color-text-primary)]">{row.original.tenant?.companyName ?? '—'}</span>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => row.original.subscription?.plan?.name ?? '—',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
          ₹{Number(row.original.amount).toLocaleString()}
        </span>
      ),
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
      accessorKey: 'paidAt',
      header: 'Paid At',
      cell: ({ row }) => row.original.paidAt
        ? <span className="text-[var(--color-text-secondary)] text-xs">{dayjs(row.original.paidAt).format('DD MMM YYYY')}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Billed On',
      cell: ({ row }) => (
        <span className="text-[var(--color-text-muted)] text-xs">{dayjs(row.original.createdAt).format('DD MMM YYYY')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => row.original.status === 'PENDING' ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => markPaidMutation.mutate(row.original.id)}
          loading={markPaidMutation.isPending}
        >
          <CheckCircle size={12} /> Mark Paid
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Billing Dashboard</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Track invoices, payments, and billing status</p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div className="relative overflow-hidden rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] card-hover">
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[var(--color-success)]" />
            <div className="flex items-start justify-between">
              <div className="pl-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-success)] mb-1 opacity-80">Total Paid</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                  ₹{data.summary.totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
                <TrendingUp size={18} className="text-[var(--color-success)]" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] card-hover">
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[var(--color-warning)]" />
            <div className="flex items-start justify-between">
              <div className="pl-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-warning)] mb-1 opacity-80">Total Pending</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                  ₹{data.summary.totalPending.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
                <Clock size={18} className="text-[var(--color-warning)]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI Settings Card */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <QrCode size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Platform UPI Settings</h3>
        </div>
        <div className="p-6">
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Tenants will see this UPI ID and QR code when they need to pay their subscription bill.
          </p>
          <form onSubmit={handleSubmit(d => upiMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="UPI ID" placeholder="example@upi" {...register('upiId')} />
            <Input label="Account Name" placeholder="Your Business Name" {...register('upiAccountName')} />
            <Input label="QR Code Image URL" placeholder="https://…" {...register('upiQrImageUrl')} />
            <div className="sm:col-span-3 flex items-center justify-between">
              {upiData?.upiQrImageUrl && (
                <img
                  src={upiData.upiQrImageUrl}
                  alt="UPI QR"
                  className="h-20 w-20 rounded-xl border border-[var(--color-border)] object-contain"
                />
              )}
              <Button type="submit" loading={isSubmitting} className="ml-auto">
                Save UPI Settings
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterCard
        title="Filter Billing"
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => setParams({ tenantId, status, from, to })}
        onReset={() => {
          setTenantId('');
          setStatus('');
          setFrom('');
          setTo('');
          setParams({ tenantId: '', status: '', from: '', to: '' });
        }}
      >
        <Select
          label="Tenant"
          options={tenantOptions}
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-52"
        />
        <Select
          label="Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PENDING', label: 'Pending' },
          ]}
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-36"
        />
      </FilterCard>

      <DataTable data={data?.billings ?? []} columns={columns} isLoading={isLoading} />
    </div>
  );
}
