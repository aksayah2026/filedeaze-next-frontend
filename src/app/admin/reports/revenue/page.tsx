'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/axios';
import { RevenueReport } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { PageSpinner } from '@/components/ui/Spinner';
import { ColumnDef } from '@tanstack/react-table';
import { Download, Search, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';

type Payment = RevenueReport['payments'][number];

const METHOD_COLORS: Record<string, string> = {
  CASH: '#10b981',
  UPI: '#3b82f6',
  CARD: '#8b5cf6',
  ONLINE: '#f59e0b',
};

function exportCsv(payments: Payment[]) {
  const headers = ['Ticket', 'Customer', 'Amount', 'Method', 'Date'];
  const rows = payments.map(p => [p.ticketNumber, p.customer, p.amount, p.method, dayjs(p.date).format('DD MMM YYYY')]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue-report-${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RevenueReportPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useQuery<RevenueReport>({
    queryKey: ['revenue-report', params],
    queryFn: async () => {
      const res = await api.get('/web/admin/reports/revenue', { params });
      const d = res.data.data;
      return {
        payments: Array.isArray(d?.payments) ? d.payments : [],
        total: d?.total ?? 0,
        byMethod: d?.byMethod ?? {},
      };
    },
    staleTime: 30_000,
    retry: 1,
  });

  const columns: ColumnDef<Payment, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket' },
    { accessorKey: 'customer', header: 'Customer' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString()}</span>,
    },
    { accessorKey: 'method', header: 'Method' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => dayjs(row.original.date).format('DD MMM YYYY') },
  ];

  const chartData = Object.entries(data?.byMethod ?? {}).map(([method, amount]) => ({ method, amount: amount ?? 0 }));
  const payments = data?.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Revenue Report</h2>
        <Button variant="secondary" onClick={() => exportCsv(payments)} disabled={!payments.length}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <Input 
          label="From" 
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
          className="w-44"
        />
        <Input 
          label="To" 
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
          className="w-44"
        />
        <Button variant="secondary" onClick={() => setParams({ from, to })}>
          <Search size={14} /> Apply
        </Button>
      </div>

      {isLoading ? <PageSpinner /> : error ? (
        <div className="rounded-xl border border-red-100 bg-[var(--color-surface-elevated)] p-6 text-sm text-red-600">
          Failed to load revenue report. Please try again.
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-100 bg-[var(--color-surface-elevated)] px-5 py-3">
            <TrendingUp size={18} className="text-emerald-600" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Total Revenue</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">
                ₹{(data?.total ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Chart — only render after mount to avoid SSR mismatch */}
          {mounted && chartData.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Revenue by Payment Method</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="method" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip
                    formatter={((value: any) => [`₹${Number(value ?? 0).toLocaleString()}`, 'Amount']) as any}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {chartData.map((entry) => (
                      <Cell key={entry.method} fill={METHOD_COLORS[entry.method] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length === 0 && !isLoading && (
            <p className="text-sm text-[var(--color-text-muted)]">No revenue data for this period.</p>
          )}

          <DataTable data={payments} columns={columns} isLoading={false} />
        </>
      )}
    </div>
  );
}
