'use client';

import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Ticket } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { TicketStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Eye } from 'lucide-react';
import dayjs from 'dayjs';

export default function CustomerHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';

  const { data: history = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['customer-history', id],
    queryFn: async () => {
      const res = await api.get(`/web/manager/customers/${id}/history`);
      return res.data.data.tickets ?? [];
    },
  });

  const columns: ColumnDef<Ticket, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket #' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
    { accessorKey: 'technician.name', header: 'Technician', cell: ({ row }) => row.original.technician?.name ?? '—' },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/${prefix}/tickets/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Customer Ticket History</h2>
      <DataTable data={history} columns={columns} />
    </div>
  );
}
