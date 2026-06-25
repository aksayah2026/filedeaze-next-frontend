'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Customer } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dayjs from 'dayjs';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', query],
    queryFn: async () => (await api.get('/web/manager/customers', { params: { search: query || undefined } })).data.data,
  });

  const columns: ColumnDef<Customer, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    { accessorKey: 'address', header: 'Address', cell: ({ row }) => row.original.address ?? '—' },
    { accessorKey: 'createdAt', header: 'Since', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions', header: '',
      cell: ({ row }) => <Link href={`/manager/customers/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Customers</h2>
      <div className="flex gap-3 mb-4">
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
        <Button variant="secondary" onClick={() => setQuery(search)}>Search</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
