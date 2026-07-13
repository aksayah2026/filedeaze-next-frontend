'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { AuditLog } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { PaginationMeta } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { FilterCard } from '@/components/ui/FilterCard';
import dayjs from 'dayjs';
import { formatDateTime } from '@/lib/utils';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [draftFilters, setDraftFilters] = useState({ entity: '', from: '', to: '' });
  const [filters, setFilters] = useState({ entity: '', from: '', to: '' });

  const { data, isLoading, isError, error, refetch } = useQuery<{ data: AuditLog[]; meta: PaginationMeta }>({
    queryKey: ['audit-logs', page, limit, filters],
    queryFn: async () => (await api.get('/web/admin/audit-logs', {
      params: { page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) },
    })).data,
    placeholderData: keepPreviousData,
  });

  const logs = data?.data ?? [];

  const columns: ColumnDef<AuditLog, unknown>[] = [
    { accessorKey: 'user.name', header: 'User', cell: ({ row }) => row.original.user?.name ?? row.original.userId },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => formatDateTime(row.original.createdAt, 'DD MMM YYYY HH:mm') },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Audit Logs</h2>
      <FilterCard
        title="Audit Logs"
        from={draftFilters.from}
        to={draftFilters.to}
        onFromChange={val => setDraftFilters(p => ({ ...p, from: val }))}
        onToChange={val => setDraftFilters(p => ({ ...p, to: val }))}
        onApply={() => { setFilters(draftFilters); setPage(1); }}
        onReset={() => { 
          const reset = { entity: '', from: '', to: '' };
          setDraftFilters(reset); 
          setFilters(reset); 
          setPage(1); 
        }}
        isLoading={isLoading}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Entity</label>
          <Select
            options={[
              { value: '', label: 'All Entities' },
              { value: 'TICKET', label: 'Ticket' },
              { value: 'TECHNICIAN', label: 'Technician' },
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'PAYMENT', label: 'Payment' },
              { value: 'USER', label: 'User' },
              { value: 'TENANT', label: 'Tenant' },
              { value: 'SETTINGS', label: 'Settings' },
            ]}
            value={draftFilters.entity}
            onChange={e => setDraftFilters(p => ({ ...p, entity: e.target.value }))}
            className="w-44 h-10"
          />
        </div>
      </FilterCard>
      <DataTable
        data={logs}
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
