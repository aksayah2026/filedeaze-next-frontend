'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Attendance, Technician } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { PaginationMeta } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { FilterCard } from '@/components/ui/FilterCard';
import dayjs from 'dayjs';

export default function AttendancePage() {
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  const [techId, setTechId] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ technicianId: '', from: monthStart, to: today });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: techs = [] } = useQuery<Technician[]>({ queryKey: ['technicians'], queryFn: async () => (await api.get('/web/manager/technicians')).data.data });
  const { data, isLoading, isError, error, refetch } = useQuery<{ items: Attendance[]; meta: PaginationMeta }>({
    queryKey: ['attendance', params, page, limit],
    queryFn: async () => (await api.get('/web/manager/attendance', {
      params: { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page, limit },
    })).data.data,
    placeholderData: keepPreviousData,
  });

  const records = data?.items ?? [];

  const columns: ColumnDef<Attendance, unknown>[] = [
    { accessorKey: 'technician.name', header: 'Technician' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => dayjs(row.original.date).format('DD MMM YYYY') },
    { accessorKey: 'checkInTime', header: 'Check In', cell: ({ row }) => row.original.checkInTime ? dayjs(row.original.checkInTime).format('HH:mm') : '—' },
    { accessorKey: 'checkOutTime', header: 'Check Out', cell: ({ row }) => row.original.checkOutTime ? dayjs(row.original.checkOutTime).format('HH:mm') : '—' },
    { accessorKey: 'checkInLat', header: 'Lat', cell: ({ row }) => row.original.checkInLat?.toFixed(4) ?? '—' },
    { accessorKey: 'checkInLng', header: 'Lng', cell: ({ row }) => row.original.checkInLng?.toFixed(4) ?? '—' },
  ];

  const techOptions = [{ value: '', label: 'All Technicians' }, ...techs.map(t => ({ value: t.id, label: t.name }))];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Attendance</h2>
      <FilterCard
        title="Attendance Filter"
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => { setPage(1); setParams({ technicianId: techId, from, to }); }}
        onReset={() => { setTechId(''); setFrom(monthStart); setTo(today); setPage(1); setParams({ technicianId: '', from: monthStart, to: today }); }}
        isLoading={isLoading}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Technician</label>
          <Select options={techOptions} value={techId} onChange={e => setTechId(e.target.value)} className="w-48 h-10" />
        </div>
      </FilterCard>
      <DataTable
        data={records}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={data?.meta ? {
          meta: data.meta,
          onPageChange: setPage,
          onLimitChange: (l) => { setPage(1); setLimit(l); },
        } : undefined}
      />
    </div>
  );
}
