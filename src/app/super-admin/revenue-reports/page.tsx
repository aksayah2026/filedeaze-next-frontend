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
import { Download, Search, TrendingUp, BarChart2 } from 'lucide-react';
import dayjs from 'dayjs';

type ReportRow = SuperAdminRevenueReport['payments'][number];

function exportCsv(rows: ReportRow[]) {
  const headers = ['Tenant', 'Plan', 'Amount', 'Status', 'Paid At', 'Created At'];
  const data = rows.map(r => [
    r.tenantName, r.planName, r.amount, r.status,
    r.paidAt ? dayjs(r.paidAt).format('DD MMM YYYY') : '—',
    dayjs(r.createdAt).format('DD MMM YYYY'),
  ]);
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
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.tenantName}</span>,
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          STARTER: 'bg-slate-100 text-slate-700',
          PROFESSIONAL: 'bg-blue-50 text-blue-700',
          ENTERPRISE: 'bg-violet-50 text-violet-700',
        };
        return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[row.original.planName] ?? 'bg-slate-100 text-slate-600'}`}>
            {row.original.planName}
          </span>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-slate-900">
          ₹{row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          row.original.status === 'PAID'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'paidAt',
      header: 'Paid At',
      cell: ({ row }) => row.original.paidAt
        ? <span className="text-xs text-slate-500">{dayjs(row.original.paidAt).format('DD MMM YYYY')}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{dayjs(row.original.createdAt).format('DD MMM YYYY')}</span>
      ),
    },
  ];

  const rows = data?.payments ?? [];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Revenue Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Subscription revenue across tenants and plans</p>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(rows)} disabled={!rows.length}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Select
          label="Tenant"
          options={tenantOptions}
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-52"
        />
        <Select
          label="Plan"
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
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">From</span>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">To</span>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 invisible">_</span>
          <Button variant="secondary" onClick={() => setParams({ tenantId, plan, from, to })}>
            <Search size={14} /> Apply
          </Button>
        </div>
      </div>

      {isLoading ? <PageSpinner /> : (
        <>
          {/* Total Revenue Hero */}
          {data && (
            <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                <TrendingUp size={64} className="text-emerald-600" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={22} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-0.5">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-slate-900">
                    ₹{data.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {mounted && (byPlanChart.length > 0 || byTenantChart.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {byPlanChart.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={15} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Revenue by Plan</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byPlanChart} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {byTenantChart.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={15} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Top Tenants by Revenue</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byTenantChart} layout="vertical" barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="tenantName"
                        type="category"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        width={80}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Payments Table */}
          <DataTable data={rows} columns={columns} isLoading={false} />
        </>
      )}
    </div>
  );
}
