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
import { Badge } from '@/components/ui/Badge';
import { Search, Download, Activity } from 'lucide-react';
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

const entityVariants: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'purple' | 'default'> = {
  TENANT:       'info',
  PLAN:         'purple',
  SUBSCRIPTION: 'success',
  BILLING:      'warning',
  USER:         'default',
};

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
    {
      accessorKey: 'user.name',
      header: 'User',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {row.original.user?.name ?? row.original.userId}
        </span>
      ),
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <Badge variant={entityVariants[row.original.entity] ?? 'default'} showDot={false}>
          {row.original.entity}
        </Badge>
      ),
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs">{row.original.module ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <code className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono">
          {row.original.action}
        </code>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-500">{row.original.ipAddress ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {dayjs(row.original.createdAt).format('DD MMM YYYY HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Activity size={17} className="text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activity Logs</h2>
            <p className="text-sm text-slate-500 mt-0.5">Audit trail of all super admin actions</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => data?.logs && exportCsv(data.logs)}
          disabled={!data?.logs?.length}
        >
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Select
          label="Entity"
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
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 invisible">_</span>
          <Button
            variant="secondary"
            onClick={() => { setFilters({ entity }); setPage(1); }}
          >
            <Search size={14} /> Filter
          </Button>
        </div>

        {/* Active filter chip */}
        {filters.entity && (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <span className="font-medium">Entity:</span> {filters.entity}
            <button
              onClick={() => { setEntity(''); setFilters({ entity: '' }); setPage(1); }}
              className="ml-1 text-blue-400 hover:text-blue-700 transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <DataTable data={data?.logs ?? []} columns={columns} isLoading={isLoading} />

      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          limit={50}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
