'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Ticket, TicketStatus } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TicketStatusBadge } from '@/components/ui/Badge';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  ...(['NEW_TICKET', 'ASSIGNED', 'ACCEPTED', 'TRAVELLING', 'REACHED_LOCATION', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'INVOICE_GENERATED', 'TICKET_CLOSED', 'CANCELLED'] as TicketStatus[])
    .map(s => ({ value: s, label: s.replace(/_/g, ' ') })),
];

export default function TicketsPage() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});

  const { data = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', params],
    queryFn: async () => (await api.get('/web/manager/tickets', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  const columns: ColumnDef<Ticket, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket #' },
    { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name },
    { accessorKey: 'technician.name', header: 'Technician', cell: ({ row }) => row.original.technician?.name ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
    { accessorKey: 'scheduledAt', header: 'Scheduled', cell: ({ row }) => row.original.scheduledAt ? dayjs(row.original.scheduledAt).format('DD MMM, HH:mm') : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/manager/tickets/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Tickets</h2>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} className="w-48" />
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ status, from, to })}>Filter</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
