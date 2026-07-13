'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Customer } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { PaginationMeta } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dayjs from 'dayjs';

export default function CustomersPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: Customer[]; meta: PaginationMeta }>({
    queryKey: ['customers', query, page, limit],
    queryFn: async () =>
      (await api.get('/web/manager/customers', { params: { search: query || undefined, page, limit } })).data.data,
    placeholderData: keepPreviousData,
  });

  const customers = data?.items ?? [];

  const columns: ColumnDef<Customer, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    { accessorKey: 'address', header: 'Address', cell: ({ row }) => row.original.address ?? '—' },
    { accessorKey: 'createdAt', header: 'Since', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions', header: '',
      cell: ({ row }) => <Link href={`/${prefix}/customers/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Customers</h2>
      <div className="flex gap-3 mb-4">
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
        <Button variant="secondary" onClick={() => { setPage(1); setQuery(search); }}>Search</Button>
      </div>
      <DataTable
        data={customers}
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
