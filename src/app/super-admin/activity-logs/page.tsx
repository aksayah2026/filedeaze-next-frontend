'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { ActivityLog } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, Download } from 'lucide-react';
import dayjs from 'dayjs';

type ActivityLogPage = { logs: ActivityLog[]; total: number; page: number; limit: number; totalPages: number };

function exportCsv(logs: ActivityLog[]) {
  const headers = ['User', 'Entity', 'Module', 'Action', 'IP Address', 'Time'];
  const rows = logs.map(l => [
    l.user?.name ?? l.userId,
    l.entity,
    l.module ?? '—',
    l.action,
    l.ipAddress ?? '—',
    dayjs(l.createdAt).format('DD MMM YYYY HH:mm'),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity-logs-${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [filters, setFilters] = useState({ entity: '' });

  const { data, isLoading } = useQuery<ActivityLogPage>({
    queryKey: ['activity-logs', page, filters],
    queryFn: async () => (await api.get('/web/super-admin/activity-logs', {
      params: { page, limit: 50, entity: filters.entity || undefined },
    })).data.data,
  });

  const columns: ColumnDef<ActivityLog, unknown>[] = [
    { accessorKey: 'user.name', header: 'User', cell: ({ row }) => row.original.user?.name ?? row.original.userId },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'module', header: 'Module', cell: ({ row }) => row.original.module ?? '—' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'ipAddress', header: 'IP Address', cell: ({ row }) => row.original.ipAddress ?? '—' },
    { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY HH:mm') },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Activity Logs</h2>
        <Button
          variant="secondary"
          onClick={() => data?.logs && exportCsv(data.logs)}
          disabled={!data?.logs?.length}
        >
          <Download size={14} /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Select
          options={[
            { value: '', label: 'All Entities' },
            { value: 'TENANT', label: 'Tenant' },
            { value: 'PLAN', label: 'Plan' },
            { value: 'SUBSCRIPTION', label: 'Subscription' },
            { value: 'BILLING', label: 'Billing' },
            { value: 'USER', label: 'User' },
          ]}
          value={entity}
          onChange={e => setEntity(e.target.value)}
          className="w-44"
        />
        <Button variant="secondary" onClick={() => { setFilters({ entity }); setPage(1); }}>
          <Search size={14} /> Filter
        </Button>
      </div>

      <DataTable data={data?.logs ?? []} columns={columns} isLoading={isLoading} />

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={50} onPageChange={setPage} />
      )}
    </div>
  );
}
