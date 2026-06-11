'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Invoice } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dayjs from 'dayjs';

export default function InvoicesPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ search: '', from: monthStart, to: today });

  const { data = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', params],
    queryFn: async () => (await api.get('/web/manager/invoices', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  const columns: ColumnDef<Invoice, unknown>[] = [
    { accessorKey: 'invoiceNumber', header: 'Invoice #' },
    { accessorKey: 'ticket.ticketNumber', header: 'Ticket', cell: ({ row }) => row.original.ticket?.ticketNumber ?? row.original.ticketId },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toLocaleString()}` },
    { accessorKey: 'gstAmount', header: 'GST', cell: ({ row }) => row.original.gstAmount ? `₹${row.original.gstAmount.toLocaleString()}` : '—' },
    { accessorKey: 'totalAmount', header: 'Total', cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString()}` },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/manager/invoices/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Invoices</h2>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ search, from, to })}>Filter</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
