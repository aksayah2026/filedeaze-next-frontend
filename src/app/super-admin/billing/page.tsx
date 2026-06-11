'use client';

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { Billing, BillingReport } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import dayjs from 'dayjs';

export default function BillingPage() {
  const { data, isLoading } = useQuery<BillingReport>({
    queryKey: ['billing'],
    queryFn: async () => (await api.get('/web/super-admin/billing')).data.data,
  });

  const columns: ColumnDef<Billing, unknown>[] = [
    { accessorKey: 'tenant.companyName', header: 'Tenant' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toLocaleString()}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>{row.original.status}</Badge> },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => dayjs(row.original.dueDate).format('DD MMM YYYY') },
    { accessorKey: 'paidAt', header: 'Paid At', cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—' },
  ];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Billing Report</h2>
      {data?.summary && (
        <div className="grid grid-cols-2 gap-5 mb-6 max-w-sm">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600">Total Paid</p>
            <p className="text-xl font-bold text-green-700">₹{data.summary.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-xs text-yellow-600">Total Pending</p>
            <p className="text-xl font-bold text-yellow-700">₹{data.summary.totalPending.toLocaleString()}</p>
          </div>
        </div>
      )}
      <DataTable data={data?.billings ?? []} columns={columns} />
    </div>
  );
}
