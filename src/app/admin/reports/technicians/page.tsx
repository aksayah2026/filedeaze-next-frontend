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
        (await api.get('/web/admin/reports/technicians')).data.data;
      return raw.map(t => ({ id: t.id, name: t.name, totalTickets: t._count.tickets, attendanceDays: t._count.attendance, rating: t.rating ?? 0 }));
    },
  });

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
    {
      accessorKey: 'acceptanceRate', header: 'Acceptance Rate',
      cell: ({ row }) => <span>{row.original.acceptanceRate.toFixed(1)}%</span>,
    },
    {
      accessorKey: 'averageResponseMinutes', header: 'Avg. Response Time',
      cell: ({ row }) => (
        <span>{row.original.averageResponseMinutes !== null ? `${row.original.averageResponseMinutes} min` : '—'}</span>
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
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Technician Report</h2>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
