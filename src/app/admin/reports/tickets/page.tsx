'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, Pie, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '@/lib/axios';
import { TicketReport, TicketStatus } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Ticket, Clock, CheckCircle2, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import dayjs from 'dayjs';

import { ReportLayout, KpiGrid, InsightsCard } from '@/components/ui/ReportLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  NEW_TICKET: '#3b82f6', // blue
  ASSIGNED: '#8b5cf6', // violet
  ACCEPTED: '#6366f1', // indigo
  TRAVELLING: '#f59e0b', // amber
  REACHED_LOCATION: '#f97316', // orange
  IN_PROGRESS: '#0ea5e9', // sky
  PENDING: '#ef4444', // red
  COMPLETED: '#10b981', // emerald
  INVOICE_GENERATED: '#14b8a6', // teal
  TICKET_CLOSED: '#059669', // green
  CANCELLED: '#6b7280', // gray
};

const PRIORITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

// Groupings for KPIs
const OPEN_STATUSES = ['NEW_TICKET', 'ASSIGNED', 'ACCEPTED'];
const IN_PROGRESS_STATUSES = ['TRAVELLING', 'REACHED_LOCATION', 'IN_PROGRESS', 'PENDING'];
const COMPLETED_STATUSES = ['COMPLETED', 'INVOICE_GENERATED', 'TICKET_CLOSED'];
const CANCELLED_STATUSES = ['CANCELLED'];

export default function TicketsReportPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery<TicketReport>({
    queryKey: ['tickets-report', params],
    queryFn: async () => {
      const res = await api.get('/web/admin/reports/tickets', { params });
      const d = res.data.data;
      return { byStatus: d?.byStatus ?? {} };
    },
    staleTime: 30_000,
    retry: 1,
  });

  const byStatus = data?.byStatus ?? {};
  
  // Calculate KPIs
  const totalTickets = Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0) || 0;
  
  const openCount = OPEN_STATUSES.reduce((sum, status) => sum + (byStatus[status as TicketStatus] || 0), 0);
  const inProgressCount = IN_PROGRESS_STATUSES.reduce((sum, status) => sum + (byStatus[status as TicketStatus] || 0), 0);
  const completedCount = COMPLETED_STATUSES.reduce((sum, status) => sum + (byStatus[status as TicketStatus] || 0), 0);
  const cancelledCount = CANCELLED_STATUSES.reduce((sum, status) => sum + (byStatus[status as TicketStatus] || 0), 0);

  const avgResolutionTime = totalTickets > 0 ? '2h 15m' : '0h 0m'; // Mocked as requested

  const chartData = Object.entries(byStatus).map(([status, count]) => ({
    name: (status as TicketStatus).replace(/_/g, ' '),
    originalStatus: status,
    value: count ?? 0,
  })).filter(d => d.value > 0);

  // MOCK: Ticket Trend Over Time (Stacked Bar Chart)
  // Generating a fake trend based on the total tickets count spread over 7 days
  const trendData = useMemo(() => {
    if (totalTickets === 0) return [];
    const days = 7;
    const result = [];
    let remaining = totalTickets;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MMM DD');
      if (i === 0) {
        result.push({ date, Open: Math.floor(remaining * 0.3), InProgress: Math.floor(remaining * 0.2), Completed: Math.ceil(remaining * 0.5) });
      } else {
        const alloc = Math.max(1, Math.floor(totalTickets / days));
        remaining -= alloc;
        result.push({ date, Open: Math.floor(alloc * 0.3), InProgress: Math.floor(alloc * 0.2), Completed: Math.ceil(alloc * 0.5) });
      }
    }
    return result;
  }, [totalTickets]);

  // MOCK: Priority Distribution
  const priorityData = useMemo(() => {
    if (totalTickets === 0) return [];
    return [
      { name: 'High', value: Math.ceil(totalTickets * 0.2) },
      { name: 'Medium', value: Math.ceil(totalTickets * 0.5) },
      { name: 'Low', value: Math.floor(totalTickets * 0.3) }
    ];
  }, [totalTickets]);

  // MOCK: Detailed Data Table
  const mockTableData = useMemo(() => {
    if (totalTickets === 0) return [];
    return Array.from({ length: Math.min(totalTickets, 8) }).map((_, i) => ({
      id: `TKT-2026-000${i+1}`,
      customer: ['Acme Corp', 'Stark Ind', 'Wayne Ent', 'Globex'][i % 4],
      technician: ['Aravind', 'Benthal', 'Cathrel'][i % 3],
      priority: ['High', 'Medium', 'Low'][i % 3],
      status: Object.keys(byStatus)[i % Object.keys(byStatus).length]?.replace(/_/g, ' ') || 'COMPLETED',
      createdDate: dayjs().subtract(i, 'day').format('DD MMM YYYY'),
      closedDate: i % 2 === 0 ? dayjs().subtract(i-1, 'day').format('DD MMM YYYY') : '-'
    }));
  }, [totalTickets, byStatus]);

  // Generate Insights
  const insights = useMemo(() => {
    if (totalTickets === 0) return ['No ticket data recorded for this period.'];
    const i = [];
    i.push(`Total ticket volume reached ${totalTickets} during the selected period.`);
    
    if (completedCount > 0) {
      const completionRate = Math.round((completedCount / totalTickets) * 100);
      i.push(`Operations achieved a solid ${completionRate}% completion rate.`);
    }
    
    if (inProgressCount > 0) {
      i.push(`There are currently ${inProgressCount} tickets in active progression requiring attention.`);
    }
    
    i.push(`Average resolution time is holding steady at ${avgResolutionTime}.`);
    
    return i;
  }, [totalTickets, completedCount, inProgressCount, avgResolutionTime]);

  const columns: ColumnDef<any, unknown>[] = [
    { accessorKey: 'id', header: 'Ticket ID' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'technician', header: 'Technician' },
    { 
      accessorKey: 'priority', 
      header: 'Priority',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: `${PRIORITY_COLORS[row.original.priority]}20`, color: PRIORITY_COLORS[row.original.priority] }}>
          {row.original.priority}
        </span>
      )
    },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'createdDate', header: 'Created Date' },
    { accessorKey: 'closedDate', header: 'Closed Date' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-lg rounded-xl p-3 text-sm">
          <p className="text-[var(--color-text-secondary)] font-medium mb-2">{label || payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color || entry.payload.fill }} />
              <span className="text-[var(--color-text-primary)] font-semibold">{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ReportLayout
      title="Operations & Tickets"
      description="Monitor service volume, technician workloads, and resolution metrics."
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
    >
      {/* KPI Cards */}
      <KpiGrid>
        <StatsCard
          title="Total Tickets"
          value={totalTickets}
          icon={Ticket}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          accentColor="bg-blue-500"
        />
        <StatsCard
          title="Open"
          value={openCount}
          icon={AlertCircle}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100 dark:bg-indigo-500/20"
          accentColor="bg-indigo-500"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount}
          icon={PlayCircle}
          iconColor="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          accentColor="bg-amber-500"
        />
        <StatsCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          accentColor="bg-emerald-500"
          trend={{ value: 5, label: 'vs previous' }}
        />
        <StatsCard
          title="Cancelled"
          value={cancelledCount}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-100 dark:bg-red-500/20"
          accentColor="bg-red-500"
        />
        <StatsCard
          title="Avg Resolution"
          value={avgResolutionTime}
          icon={Clock}
          iconColor="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          accentColor="bg-violet-500"
          trend={{ value: -12, label: 'faster' }}
        />
      </KpiGrid>

      {totalTickets === 0 && !isLoading ? (
        <EmptyState title="No Ticket Data" description="Try adjusting your date filters to see operational data." />
      ) : (
        <>
          {/* Primary Chart */}
          {mounted && trendData.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Ticket Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-elevated)', opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingTop: '20px' }} />
                  <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={48} />
                  <Bar dataKey="InProgress" stackId="a" fill="#f59e0b" maxBarSize={48} />
                  <Bar dataKey="Open" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            {mounted && chartData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.originalStatus] || '#6366f1'} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Horizontal Bar Chart */}
            {mounted && priorityData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--color-text-primary)', fontWeight: 500 }} width={80} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-elevated)', opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
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
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Detailed Tickets</h3>
            </div>
            <DataTable data={mockTableData} columns={columns} isLoading={false} />
          </div>
        </>
      )}
    </ReportLayout>
  );
}
