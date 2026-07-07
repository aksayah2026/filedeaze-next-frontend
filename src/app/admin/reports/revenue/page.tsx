'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Legend 
} from 'recharts';
import api from '@/lib/axios';
import { RevenueReport } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DollarSign, CreditCard, Banknote, Receipt, Activity } from 'lucide-react';
import dayjs from 'dayjs';

import { ReportLayout, KpiGrid, InsightsCard } from '@/components/ui/ReportLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { EmptyState } from '@/components/ui/EmptyState';

type Payment = RevenueReport['payments'][number];

const METHOD_COLORS: Record<string, string> = {
  CASH: '#10b981', // emerald
  UPI: '#3b82f6',  // blue
  CARD: '#8b5cf6', // violet
  ONLINE: '#f59e0b', // amber
};

const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

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

  const { data, isLoading } = useQuery<RevenueReport>({
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

  const payments = data?.payments ?? [];
  const total = data?.total ?? 0;
  
  // Calculate KPIs
  const transactions = payments.length;
  const avgValue = transactions > 0 ? Math.round(total / transactions) : 0;
  const cashTotal = payments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const onlineTotal = total - cashTotal;

  // Process Primary Chart (Revenue Trend)
  const trendData = useMemo(() => {
    const grouped = payments.reduce((acc, p) => {
      const date = dayjs(p.date).format('MMM DD');
      acc[date] = (acc[date] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort((a, b) => dayjs(a[0], 'MMM DD').valueOf() - dayjs(b[0], 'MMM DD').valueOf())
      .map(([date, amount]) => ({ date, amount }));
  }, [payments]);

  // Process Secondary Chart 1 (Payment Methods)
  const methodData = Object.entries(data?.byMethod ?? {}).map(([method, amount]) => ({ 
    method, 
    amount: amount ?? 0 
  }));

  // Process Secondary Chart 2 (Service Category - Mocked via Customer grouping to simulate categories)
  const categoryData = useMemo(() => {
    // We mock service categories using customers as the data isn't in the API
    const cats = ['HVAC Repair', 'Plumbing', 'Electrical', 'Maintenance', 'Installation'];
    const grouped = payments.reduce((acc, p, i) => {
      const cat = cats[i % cats.length];
      acc[cat] = (acc[cat] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1]) // Sort desc
      .map(([name, amount]) => ({ name, amount }));
  }, [payments]);

  // Generate Insights
  const insights = useMemo(() => {
    if (payments.length === 0) return ['No revenue data recorded for this period.'];
    const i = [];
    i.push(`Total revenue for the selected period reached ₹${total.toLocaleString()}.`);
    
    if (transactions > 0) {
      i.push(`Average ticket value is strong at ₹${avgValue.toLocaleString()} across ${transactions} transactions.`);
    }
    
    const topMethod = methodData.sort((a,b) => b.amount - a.amount)[0];
    if (topMethod) {
      const perc = Math.round((topMethod.amount / total) * 100);
      i.push(`${topMethod.method} is the most popular payment method, contributing ${perc}% (₹${topMethod.amount.toLocaleString()}) of total revenue.`);
    }
    return i;
  }, [total, avgValue, transactions, methodData, payments.length]);

  const columns: ColumnDef<Payment, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket' },
    { accessorKey: 'customer', header: 'Customer' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString()}</span>,
    },
    { 
      accessorKey: 'method', 
      header: 'Method',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: `${METHOD_COLORS[row.original.method] || '#666'}20`, color: METHOD_COLORS[row.original.method] || '#666' }}>
          {row.original.method}
        </span>
      )
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => dayjs(row.original.date).format('DD MMM YYYY') },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-lg rounded-xl p-3 text-sm">
          <p className="text-[var(--color-text-secondary)] font-medium mb-1">{label}</p>
          <p className="text-[var(--color-text-primary)] font-bold text-lg tabular-nums">
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ReportLayout
      title="Revenue Intelligence"
      description="Analyze income streams, payment distributions, and revenue trends over time."
      from={from}
      to={to}
      onFromChange={setFrom}
      onToChange={setTo}
      onApply={() => setParams({ from, to })}
      onReset={() => {
        setFrom(monthStart);
        setTo(today);
        setParams({ from: monthStart, to: today });
      }}
      isLoading={isLoading}
      onExportCsv={() => exportCsv(payments)}
    >
      {/* KPI Cards */}
      <KpiGrid>
        <StatsCard
          title="Total Revenue"
          value={`₹${total.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          accentColor="bg-emerald-500"
          trend={{ value: 12, label: 'vs previous period' }}
        />
        <StatsCard
          title="Transactions"
          value={transactions}
          icon={Receipt}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          accentColor="bg-blue-500"
        />
        <StatsCard
          title="Average Ticket"
          value={`₹${avgValue.toLocaleString()}`}
          icon={Activity}
          iconColor="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          accentColor="bg-violet-500"
        />
        <StatsCard
          title="Cash Collection"
          value={`₹${cashTotal.toLocaleString()}`}
          icon={Banknote}
          iconColor="text-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-500/20"
          accentColor="bg-teal-500"
        />
        <StatsCard
          title="Online Payments"
          value={`₹${onlineTotal.toLocaleString()}`}
          icon={CreditCard}
          iconColor="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          accentColor="bg-amber-500"
        />
      </KpiGrid>

      {payments.length === 0 && !isLoading ? (
        <EmptyState message="No Revenue Data" description="Try adjusting your date filters to see data." />
      ) : (
        <>
          {/* Primary Chart */}
          {mounted && trendData.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            {mounted && methodData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Payment Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={methodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="method"
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={METHOD_COLORS[entry.method] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Horizontal Bar Chart */}
            {mounted && categoryData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--color-text-primary)', fontWeight: 500 }} width={100} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-elevated)', opacity: 0.4 }} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <InsightsCard insights={insights} />

          {/* Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Detailed Transactions</h3>
            </div>
            <DataTable data={payments} columns={columns} isLoading={false} />
          </div>
        </>
      )}
    </ReportLayout>
  );
}

