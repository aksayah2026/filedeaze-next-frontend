'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { SuperAdminRevenueReport, Tenant } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { Download, Search, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { FilterCard } from '@/components/ui/FilterCard';
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
      cell: ({ row }) => <span className="font-medium text-[var(--color-text-primary)]">{row.original.tenantName}</span>,
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          STARTER: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]',
          PROFESSIONAL: 'bg-[var(--color-surface-elevated)] text-blue-700',
          ENTERPRISE: 'bg-[var(--color-surface-elevated)] text-violet-700',
        };
        return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[row.original.planName] ?? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'}`}>
            {row.original.planName}
          </span>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
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
            ? 'bg-[var(--color-surface-elevated)] text-emerald-700'
            : 'bg-[var(--color-surface-elevated)] text-amber-700'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'paidAt',
      header: 'Paid At',
      cell: ({ row }) => row.original.paidAt
        ? <span className="text-xs text-[var(--color-text-muted)]">{dayjs(row.original.paidAt).format('DD MMM YYYY')}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--color-text-muted)]">{dayjs(row.original.createdAt).format('DD MMM YYYY')}</span>
      ),
    },
  ];

  const rows = data?.payments ?? [];

  const byDurationChart: Array<{ date: string; amount: number }> = [];
  if (data?.payments) {
    const fromDate = dayjs(from);
    const toDate = dayjs(to);
    const isMonthly = toDate.diff(fromDate, 'day') > 60;
    const formatStr = isMonthly ? 'MMM YYYY' : 'DD MMM';
    
    const map = new Map<string, number>();
    let curr = fromDate.clone();
    while (curr.isBefore(toDate) || curr.isSame(toDate, isMonthly ? 'month' : 'day')) {
      map.set(curr.format(formatStr), 0);
      curr = curr.add(1, isMonthly ? 'month' : 'day');
    }

    data.payments.forEach(p => {
      if (p.status === 'PAID' && p.paidAt) {
        const key = dayjs(p.paidAt).format(formatStr);
        if (map.has(key)) {
          map.set(key, map.get(key)! + p.amount);
        }
      }
    });

    map.forEach((amount, date) => byDurationChart.push({ date, amount }));
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Revenue Reports</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Subscription revenue across tenants and plans</p>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(rows)} disabled={!rows.length}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterCard
        title="Filter Revenue"
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => setParams({ tenantId, plan, from, to })}
        onReset={() => {
          setTenantId('');
          setPlan('');
          setFrom(monthStart);
          setTo(today);
          setParams({ tenantId: '', plan: '', from: monthStart, to: today });
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
      </FilterCard>

      {isLoading ? <PageSpinner /> : (
        <>
          {/* Total Revenue Hero */}
          {data && (
            <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5">
                <TrendingUp size={64} className="text-[var(--color-primary)]" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-ring)] flex items-center justify-center">
                  <TrendingUp size={22} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
                    ₹{data.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Revenue by Duration Chart */}
          {mounted && byDurationChart.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={15} className="text-[var(--color-text-muted)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Revenue by Duration</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={byDurationChart}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}
                    itemStyle={{ color: 'var(--color-text-secondary)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts */}
          {mounted && (byPlanChart.length > 0 || byTenantChart.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {byPlanChart.length > 0 && (
                <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={15} className="text-[var(--color-text-muted)]" />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Revenue by Plan</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byPlanChart} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface-elevated)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}
                        itemStyle={{ color: 'var(--color-text-secondary)' }}
                      />
                      <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {byTenantChart.length > 0 && (
                <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={15} className="text-[var(--color-text-muted)]" />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Top Tenants by Revenue</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byTenantChart} layout="vertical" barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="tenantName"
                        type="category"
                        tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                        width={80}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface-elevated)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}
                        itemStyle={{ color: 'var(--color-text-secondary)' }}
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
