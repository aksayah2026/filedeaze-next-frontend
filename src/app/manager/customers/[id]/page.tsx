'use client';

import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Ticket, CustomerAsset } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { TicketStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Eye, Plus, Box } from 'lucide-react';
import dayjs from 'dayjs';

export default function CustomerHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';

  const { data: history = [], isLoading, isError, error, refetch } = useQuery<Ticket[]>({
    queryKey: ['customer-history', id],
    queryFn: async () => {
      const res = await api.get(`/web/manager/customers/${id}/history`);
      return res.data.data.tickets ?? [];
    },
  });

  const { data: assets = [] } = useQuery<CustomerAsset[]>({
    queryKey: ['customer-assets-summary', id],
    queryFn: async () => (await api.get('/web/manager/customer-assets', { params: { customerId: id } })).data.data,
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
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5"><Box size={15} /> Customer Assets</h3>
          <div className="flex items-center gap-2">
            <Link href={`/${prefix}/assets?customerId=${id}&openCreate=true`}>
              <Button size="sm" variant="secondary"><Plus size={13} /> Add Asset</Button>
            </Link>
            <Link href={`/${prefix}/assets?customerId=${id}`} className="text-xs text-[var(--color-primary)] hover:underline">
              View all →
            </Link>
          </div>
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No assets registered for this customer yet.</p>
        ) : (
          <div className="space-y-2">
            {assets.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-[var(--color-border)] last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{a.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{[a.brand, a.model].filter(Boolean).join(' / ') || a.category?.name || '—'}</p>
                </div>
                <Link href={`/${prefix}/assets/${a.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Customer Ticket History</h2>
        <DataTable data={history} columns={columns} isError={isError} error={error} onRetry={refetch} />
      </div>
    </div>
  );
}
