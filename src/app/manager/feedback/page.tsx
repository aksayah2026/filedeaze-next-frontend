'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Feedback } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });

  const { data = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ['feedback', params],
    queryFn: async () => (await api.get('/web/manager/feedback', { params })).data.data,
  });

  const columns: ColumnDef<Feedback, unknown>[] = [
    { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
    { accessorKey: 'technician.name', header: 'Technician', cell: ({ row }) => row.original.technician?.name ?? '—' },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => <Stars rating={row.original.rating} /> },
    { accessorKey: 'review', header: 'Review', cell: ({ row }) => <span className="text-[var(--color-text-muted)] text-xs">{row.original.review ?? '—'}</span> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Feedback</h2>
      <div className="flex gap-3 mb-4 items-end">
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ from, to })}>Filter</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
