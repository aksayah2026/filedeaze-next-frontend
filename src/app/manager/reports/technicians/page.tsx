'use client';

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { TechnicianReportRow } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Star } from 'lucide-react';

export default function ManagerTechniciansReportPage() {
  const { data = [], isLoading, isError, error, refetch } = useQuery<TechnicianReportRow[]>({
    queryKey: ['manager-technicians-report'],
    queryFn: async () => {
      const raw: {
        id: string; name: string; rating: number;
        acceptanceRate: number; averageResponseMinutes: number | null;
        _count: { tickets: number; attendance: number };
      }[] = (await api.get('/web/manager/reports/technicians')).data.data;
      return raw.map(t => ({
        id: t.id,
        name: t.name,
        totalTickets: t._count.tickets,
        attendanceDays: t._count.attendance,
        rating: t.rating ?? 0,
        acceptanceRate: t.acceptanceRate ?? 0,
        averageResponseMinutes: t.averageResponseMinutes,
      }));
    },
  });

  const responded = data.filter(t => t.averageResponseMinutes !== null);
  const fastest = responded.length ? responded.reduce((a, b) => (a.averageResponseMinutes! < b.averageResponseMinutes! ? a : b)) : null;
  const slowest = responded.length ? responded.reduce((a, b) => (a.averageResponseMinutes! > b.averageResponseMinutes! ? a : b)) : null;

  const columns: ColumnDef<TechnicianReportRow, unknown>[] = [
    { accessorKey: 'name', header: 'Technician' },
    { accessorKey: 'totalTickets', header: 'Total Tickets' },
    { accessorKey: 'attendanceDays', header: 'Attendance Days' },
    {
      accessorKey: 'rating', header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star size={13} className="fill-yellow-400 text-yellow-400" />
          <span>{row.original.rating.toFixed(1)}</span>
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

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Technician Report</h2>
      {fastest && slowest && (
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Fastest: <span className="font-medium text-[var(--color-text-secondary)]">{fastest.name}</span> ({fastest.averageResponseMinutes} min) ·{' '}
          Slowest: <span className="font-medium text-[var(--color-text-secondary)]">{slowest.name}</span> ({slowest.averageResponseMinutes} min)
        </p>
      )}
      <DataTable data={data} columns={columns} isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
    </div>
  );
}
