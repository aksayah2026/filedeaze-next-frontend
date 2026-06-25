'use client';

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { TechnicianReportRow } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Star } from 'lucide-react';

export default function TechniciansReportPage() {
  const { data = [], isLoading } = useQuery<TechnicianReportRow[]>({
    queryKey: ['technicians-report'],
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
          <span>{row.original.rating.toFixed(1)}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Technician Report</h2>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
