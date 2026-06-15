'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { SuperAdminRevenueReport, Tenant } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { Download, Search, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';

type ReportRow = SuperAdminRevenueReport['payments'][number];

function exportCsv(rows: ReportRow[]) {
  const headers = ['Tenant', 'Plan', 'Amount', 'Status', 'Paid At', 'Created At'];
  const data = rows.map(r => [r.tenantName, r.planName, r.amount, r.status, r.paidAt ? dayjs(r.paidAt).format('DD MMM YYYY') : '—', dayjs(r.createdAt).format('DD MMM YYYY')]);
  const csv = [headers, ...data].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue-report-${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RevenueReportsPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

  const [tenantId, setTenantId] = useState('');
  const [plan, setPlan] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ tenantId: '', plan: '', from: monthStart, to: today });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery<SuperAdminRevenueReport>({
    queryKey: ['sa-revenue-report', params],
    queryFn: async () => (await api.get('/web/super-admin/reports/revenue', {
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

  const byPlanChart = data
    ? Object.entries(data.byPlan).map(([name, amount]) => ({ name, amount }))
    : [];

  const byTenantChart = data?.byTenant?.slice(0, 8) ?? [];

  const columns: ColumnDef<ReportRow, unknown>[] = [
    { accessorKey: 'tenantName', header: 'Tenant' },
    { accessorKey: 'planName', header: 'Plan' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString()}</span> },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'paidAt', header: 'Paid At', cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—' },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
  ];

  const rows = data?.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Revenue Reports</h2>
          <p className="mt-0.5 text-sm text-gray-500">Subscription revenue across tenants and plans</p>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(rows)} disabled={!rows.length}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Select
          options={tenantOptions}
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-56"
        />
        <Select
          options={[
            { value: '', label: 'All Plans' },
            { value: 'STARTER', label: 'Starter' },
            { value: 'PROFESSIONAL', label: 'Professional' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]}
          value={plan}
          onChange={e => setPlan(e.target.value)}
          className="w-40"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => setParams({ tenantId, plan, from, to })}>
          <Search size={14} /> Apply
        </Button>
      </div>

      {isLoading ? <PageSpinner /> : (
        <>
          {/* Total */}
          {data && (
            <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3">
              <TrendingUp size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Total Revenue</p>
                <p className="text-2xl font-bold tabular-nums text-gray-900">₹{data.total.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Charts — gated on mounted to avoid SSR/hydration mismatch with ResizeObserver */}
          {mounted && (byPlanChart.length > 0 || byTenantChart.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {byPlanChart.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue by Plan</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byPlanChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {byTenantChart.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Top Tenants by Revenue</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byTenantChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="tenantName" type="category" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <DataTable data={rows} columns={columns} isLoading={false} />
        </>
      )}
    </div>
  );
}
