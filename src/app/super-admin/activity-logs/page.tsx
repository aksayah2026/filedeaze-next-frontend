'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { ActivityLog } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [entity, setEntity] = useState('');
  const [filters, setFilters] = useState({ userId: '', entity: '' });

  type ActivityLogPage = { logs: ActivityLog[]; total: number; page: number; limit: number; totalPages: number };
  const { data, isLoading } = useQuery<ActivityLogPage>({
    queryKey: ['activity-logs', page, filters],
    queryFn: async () => (await api.get('/web/super-admin/activity-logs', {
      params: { page, limit: 50, userId: filters.userId || undefined, entity: filters.entity || undefined },
    })).data.data,
  });

  const columns: ColumnDef<ActivityLog, unknown>[] = [
    { accessorKey: 'user.name', header: 'User', cell: ({ row }) => row.original.user?.name ?? row.original.userId },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY HH:mm') },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Activity Logs</h2>
      <div className="flex gap-3 mb-4">
        <Input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} className="w-48" />
        <Input placeholder="Entity" value={entity} onChange={e => setEntity(e.target.value)} className="w-48" />
        <Button variant="secondary" onClick={() => { setFilters({ userId, entity }); setPage(1); }}>
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
