'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Attendance, Technician } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

export default function AttendancePage() {
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  const [techId, setTechId] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ technicianId: '', from: monthStart, to: today });

  const { data: techs = [] } = useQuery<Technician[]>({ queryKey: ['technicians'], queryFn: async () => (await api.get('/web/manager/technicians')).data.data });
  const { data = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance', params],
    queryFn: async () => (await api.get('/web/manager/attendance', { params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)) })).data.data,
  });

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
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Select options={techOptions} value={techId} onChange={e => setTechId(e.target.value)} className="w-48" />
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ technicianId: techId, from, to })}><Search size={14} /> Filter</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
