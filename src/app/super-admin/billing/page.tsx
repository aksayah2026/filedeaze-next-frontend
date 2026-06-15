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
import { Search, CheckCircle, QrCode } from 'lucide-react';
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
      cell: ({ row }) => <span className="font-mono text-xs text-gray-500">{row.original.id.slice(0, 8).toUpperCase()}</span>,
    },
    { accessorKey: 'tenant.companyName', header: 'Tenant', cell: ({ row }) => row.original.tenant?.companyName ?? '—' },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => row.original.subscription?.plan?.name ?? '—',
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${Number(row.original.amount).toLocaleString()}` },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: 'paidAt', header: 'Paid At', cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—' },
    { accessorKey: 'createdAt', header: 'Billed On', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => row.original.status === 'PENDING' ? (
        <Button size="sm" variant="secondary" onClick={() => markPaidMutation.mutate(row.original.id)}>
          <CheckCircle size={13} /> Mark Paid
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Billing Dashboard</h2>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-5 max-w-sm">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600">Total Paid</p>
            <p className="text-xl font-bold text-green-700">₹{data.summary.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-xs text-yellow-600">Total Pending</p>
            <p className="text-xl font-bold text-yellow-700">₹{data.summary.totalPending.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* UPI Settings */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={18} className="text-blue-500" />
          <h3 className="font-medium text-gray-700">Platform UPI Settings</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Tenants will see this UPI ID and QR code when they need to pay their subscription bill.</p>
        <form onSubmit={handleSubmit(d => upiMutation.mutate(d))} className="grid grid-cols-3 gap-4">
          <Input label="UPI ID" placeholder="example@upi" {...register('upiId')} />
          <Input label="Account Name" placeholder="Your Business Name" {...register('upiAccountName')} />
          <Input label="QR Code Image URL" placeholder="https://..." {...register('upiQrImageUrl')} />
          <div className="col-span-3 flex items-center justify-between">
            {upiData?.upiQrImageUrl && (
              <img src={upiData.upiQrImageUrl} alt="UPI QR" className="h-20 w-20 rounded border border-gray-200 object-contain" />
            )}
            <Button type="submit" loading={isSubmitting} className="ml-auto">Save UPI Settings</Button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Select options={tenantOptions} value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-56" />
        <Select
          options={[{ value: '', label: 'All Status' }, { value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }]}
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-36"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => setParams({ tenantId, status, from, to })}>
          <Search size={14} /> Apply
        </Button>
      </div>

      <DataTable data={data?.billings ?? []} columns={columns} isLoading={isLoading} />
    </div>
  );
}
