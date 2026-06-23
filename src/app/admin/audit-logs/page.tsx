'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { AuditLog } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState({ entity: '', from: '', to: '' });
  const [filters, setFilters] = useState({ entity: '', from: '', to: '' });

  const { data = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => (await api.get('/web/admin/audit-logs', {
      params: { page, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) },
    })).data.data,
  });

  const columns: ColumnDef<AuditLog, unknown>[] = [
    { accessorKey: 'user.name', header: 'User', cell: ({ row }) => row.original.user?.name ?? row.original.userId },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY HH:mm') },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Audit Logs</h2>
      <div className="flex flex-wrap gap-3 mb-4 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Entity</span>
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
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">From</span>
          <Input 
            type="date" 
            value={draftFilters.from} 
            onChange={e => {
              const val = e.target.value;
              setDraftFilters(p => {
                const next = { ...p, from: val };
                if (p.to && val > p.to) {
                  next.to = val;
                }
                return next;
              });
            }} 
            max={draftFilters.to || undefined}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">To</span>
          <Input 
            type="date" 
            value={draftFilters.to} 
            onChange={e => {
              const val = e.target.value;
              setDraftFilters(p => {
                const next = { ...p, to: val };
                if (p.from && val < p.from) {
                  next.from = val;
                }
                return next;
              });
            }} 
            min={draftFilters.from || undefined}
            className="w-40"
          />
        </div>
        <Button variant="secondary" onClick={() => { setFilters(draftFilters); setPage(1); }}><Search size={14} /> Filter</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
