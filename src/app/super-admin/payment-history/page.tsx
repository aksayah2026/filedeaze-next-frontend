'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Billing, Tenant } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Download, Search } from 'lucide-react';
import dayjs from 'dayjs';

type BillingPage = { billings: Billing[]; summary: { totalPaid: number; totalPending: number } };

function exportCsv(billings: Billing[]) {
  const headers = ['Ref', 'Tenant', 'Plan', 'Amount', 'Status', 'Due Date', 'Paid At'];
  const rows = billings.map(b => [
    b.id.slice(0, 8).toUpperCase(),
    b.tenant?.companyName ?? '—',
    b.tenant?.subscription?.plan?.name ?? '—',
    b.amount,
    b.status,
    b.subscription?.endDate ? dayjs(b.subscription.endDate).format('DD MMM YYYY') : '—',
    b.paidAt ? dayjs(b.paidAt).format('DD MMM YYYY') : '—',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment-history-${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PaymentHistoryPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ tenantId: '', status: '', from: monthStart, to: today });

  const { data, isLoading } = useQuery<BillingPage>({
    queryKey: ['payment-history', params],
    queryFn: async () => (await api.get('/web/super-admin/billing', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants-list'],
    queryFn: async () => (await api.get('/web/super-admin/tenants')).data.data,
    staleTime: 60_000,
  });

  const tenantOptions = [
    { value: '', label: 'All Tenants' },
    ...tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` })),
  ];

  const billings = data?.billings ?? [];

  const columns: ColumnDef<Billing, unknown>[] = [
    {
      id: 'ref',
      header: 'Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[var(--color-text-muted)]">{row.original.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    { accessorKey: 'tenant.companyName', header: 'Tenant', cell: ({ row }) => row.original.tenant?.companyName ?? '—' },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => row.original.tenant?.subscription?.plan?.name ?? '—',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString()}</span>,
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
      header: 'Payment Date',
      cell: ({ row }) => row.original.paidAt
        ? <span className="text-xs text-[var(--color-text-muted)]">{dayjs(row.original.paidAt).format('DD MMM YYYY')}</span>
        : <span className="text-xs text-[var(--color-text-muted)]">—</span>,
    },
    {
      id: 'endDate',
      header: 'Sub. End Date',
      cell: ({ row }) => row.original.subscription?.endDate
        ? <span className="text-xs text-[var(--color-text-muted)]">{dayjs(row.original.subscription.endDate).format('DD MMM YYYY')}</span>
        : <span className="text-xs text-[var(--color-text-muted)]">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Payment History</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Subscription payment records across all tenants</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => exportCsv(billings)}
          disabled={!billings.length}
        >
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600">Total Paid</p>
            <p className="text-xl font-bold text-green-700 tabular-nums">₹{data.summary.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-xs text-yellow-600">Total Pending</p>
            <p className="text-xl font-bold text-yellow-700 tabular-nums">₹{data.summary.totalPending.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <Select
          options={tenantOptions}
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-56"
        />
        <Select
          options={[
            { value: '', label: 'All Status' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PENDING', label: 'Pending' },
          ]}
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-36"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">From</label>
          <Input 
            type="date" 
            value={from} 
            onChange={e => {
              const val = e.target.value;
              setFrom(val);
              if (to && val > to) {
                setTo(val);
              }
            }} 
            max={to || undefined} 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">To</label>
          <Input 
            type="date" 
            value={to} 
            onChange={e => {
              const val = e.target.value;
              setTo(val);
              if (from && val < from) {
                setFrom(val);
              }
            }} 
            min={from || undefined} 
          />
        </div>
        <Button variant="secondary" onClick={() => setParams({ tenantId, status, from, to })}>
          <Search size={14} /> Apply
        </Button>
      </div>

      <DataTable data={billings} columns={columns} isLoading={isLoading} />
    </div>
  );
}
