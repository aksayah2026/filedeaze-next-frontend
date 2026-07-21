'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Invoice } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { PaginationMeta } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterCard } from '@/components/ui/FilterCard';
import dayjs from 'dayjs';

export default function InvoicesPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ search: '', from: monthStart, to: today });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: Invoice[]; meta: PaginationMeta }>({
    queryKey: ['invoices', params, page, limit],
    queryFn: async () => (await api.get('/web/manager/invoices', {
      params: { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page, limit },
    })).data.data,
    placeholderData: keepPreviousData,
  });

  const invoices = data?.items ?? [];

  const columns: ColumnDef<Invoice, unknown>[] = [
    { accessorKey: 'invoiceNumber', header: 'Invoice #' },
    { accessorKey: 'ticket.ticketNumber', header: 'Ticket', cell: ({ row }) => row.original.ticket?.ticketNumber ?? row.original.ticketId },
    { accessorKey: 'subtotal', header: 'Subtotal', cell: ({ row }) => `₹${row.original.subtotal?.toLocaleString() ?? '0'}` },
    { accessorKey: 'gstAmount', header: 'GST', cell: ({ row }) => row.original.gstAmount ? `₹${row.original.gstAmount.toLocaleString()}` : '—' },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => `₹${row.original.total?.toLocaleString() ?? '0'}` },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/${prefix}/invoices/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Invoices</h2>
      <FilterCard
        title="Invoices Filter"
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => { setPage(1); setParams({ search, from, to }); }}
        onReset={() => { setSearch(''); setFrom(monthStart); setTo(today); setPage(1); setParams({ search: '', from: monthStart, to: today }); }}
        isLoading={isLoading}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Search</label>
          <Input placeholder="Invoice # or Ticket" value={search} onChange={e => setSearch(e.target.value)} className="w-48 h-10" />
        </div>
      </FilterCard>
      <DataTable
        data={invoices}
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
