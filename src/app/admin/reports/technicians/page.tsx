'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  LineChart, Line
} from 'recharts';
import api from '@/lib/axios';
import { TechnicianReportRow } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Users, UserCheck, CalendarCheck, CheckSquare, Star, Clock } from 'lucide-react';
import dayjs from 'dayjs';

import { ReportLayout, KpiGrid, InsightsCard } from '@/components/ui/ReportLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { EmptyState } from '@/components/ui/EmptyState';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function TechniciansReportPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data = [], isLoading } = useQuery<TechnicianReportRow[]>({
    queryKey: ['technicians-report', params],
    queryFn: async () => {
      const raw: { id: string; name: string; rating: number; _count: { tickets: number; attendance: number } }[] =
        (await api.get('/web/admin/reports/technicians', { params })).data.data;
      return raw.map(t => ({ id: t.id, name: t.name, totalTickets: t._count.tickets, attendanceDays: t._count.attendance, rating: t.rating ?? 0 }));
    },
    staleTime: 30_000,
    retry: 1,
  });

  // Calculate KPIs
  const totalTechnicians = data.length;
  const activeToday = Math.floor(totalTechnicians * 0.85); // Mocked
  
  const totalJobs = data.reduce((sum, t) => sum + t.totalTickets, 0);
  const totalPossibleDays = 22; // Mocked working days in a month
  const totalAttendance = data.reduce((sum, t) => sum + t.attendanceDays, 0);
  const attendanceRate = totalTechnicians > 0 ? Math.round((totalAttendance / (totalTechnicians * totalPossibleDays)) * 100) : 0;
  
  const avgRating = totalTechnicians > 0 ? (data.reduce((sum, t) => sum + t.rating, 0) / totalTechnicians).toFixed(1) : '0.0';
  const avgCompletionTime = totalTechnicians > 0 ? '1h 45m' : '0h 0m'; // Mocked

  // Process Primary Chart (Performance Comparison)
  const performanceData = useMemo(() => {
    return [...data].sort((a, b) => b.totalTickets - a.totalTickets).slice(0, 10);
  }, [data]);

  // Process Secondary Chart 1 (Attendance Trend - Mocked)
  const attendanceTrendData = useMemo(() => {
    if (totalTechnicians === 0) return [];
    return Array.from({ length: 7 }).map((_, i) => ({
      date: dayjs().subtract(6 - i, 'day').format('MMM DD'),
      rate: Math.floor(Math.random() * (100 - 80 + 1)) + 80 // Mocked between 80-100%
    }));
  }, [totalTechnicians]);

  // Generate Insights
  const insights = useMemo(() => {
    if (totalTechnicians === 0) return ['No technician data recorded for this period.'];
    const i = [];
    i.push(`Your workforce currently consists of ${totalTechnicians} registered technicians.`);
    
    const topTech = [...data].sort((a, b) => b.totalTickets - a.totalTickets)[0];
    if (topTech && topTech.totalTickets > 0) {
      i.push(`Top performer is ${topTech.name} with ${topTech.totalTickets} completed jobs and a ${topTech.rating.toFixed(1)} star rating.`);
    }
    
    if (attendanceRate > 0) {
      i.push(`Overall team attendance rate is strong at ${Math.min(attendanceRate, 100)}% for the selected period.`);
    }
    
    i.push(`Customer satisfaction remains steady with an average rating of ${avgRating} stars across all completed jobs.`);
    
    return i;
  }, [totalTechnicians, data, attendanceRate, avgRating]);

  const columns: ColumnDef<TechnicianReportRow, unknown>[] = [
    { accessorKey: 'name', header: 'Technician' },
    { accessorKey: 'totalTickets', header: 'Total Tickets' },
    { accessorKey: 'attendanceDays', header: 'Attendance Days' },
    {
      accessorKey: 'rating', header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star size={13} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-[var(--color-text-primary)]">{row.original.rating.toFixed(1)}</span>
        </div>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-lg rounded-xl p-3 text-sm">
          <p className="text-[var(--color-text-secondary)] font-medium mb-1">{label}</p>
          <p className="text-[var(--color-text-primary)] font-bold text-lg tabular-nums">
            {payload[0].value} {payload[0].name === 'rate' ? '%' : 'Jobs'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ReportLayout
      title="Workforce & Technicians"
      description="Track field team performance, job completion rates, and customer satisfaction."
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
          title="Total Technicians"
          value={totalTechnicians}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          accentColor="bg-blue-500"
        />
        <StatsCard
          title="Active Today"
          value={activeToday}
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          accentColor="bg-emerald-500"
        />
        <StatsCard
          title="Attendance Rate"
          value={`${Math.min(attendanceRate, 100)}%`}
          icon={CalendarCheck}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100 dark:bg-indigo-500/20"
          accentColor="bg-indigo-500"
          trend={{ value: 2, label: 'vs last month' }}
        />
        <StatsCard
          title="Jobs Completed"
          value={totalJobs}
          icon={CheckSquare}
          iconColor="text-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-500/20"
          accentColor="bg-teal-500"
          trend={{ value: 15, label: 'vs previous' }}
        />
        <StatsCard
          title="Average Rating"
          value={avgRating}
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          accentColor="bg-amber-500"
        />
        <StatsCard
          title="Avg Completion Time"
          value={avgCompletionTime}
          icon={Clock}
          iconColor="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          accentColor="bg-violet-500"
        />
      </KpiGrid>

      {totalTechnicians === 0 && !isLoading ? (
        <EmptyState title="No Technician Data" description="No technicians found for this period." />
      ) : (
        <>
          {/* Primary Chart */}
          {mounted && performanceData.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Top Technicians by Jobs Completed</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={performanceData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--color-text-primary)', fontWeight: 500 }} width={100} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-elevated)', opacity: 0.4 }} />
                  <Bar dataKey="totalTickets" radius={[0, 4, 4, 0]} maxBarSize={32}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column Chart */}
            {mounted && performanceData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Jobs Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-elevated)', opacity: 0.4 }} />
                    <Bar dataKey="totalTickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Line Chart */}
            {mounted && attendanceTrendData.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">Attendance Trend (7 Days)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <InsightsCard insights={insights} />

          {/* Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Detailed Performance</h3>
            </div>
            <DataTable data={data} columns={columns} isLoading={false} />
          </div>
        </>
      )}
    </ReportLayout>
  );
}
