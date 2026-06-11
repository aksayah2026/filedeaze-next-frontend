'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { RevenueReport } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { PageSpinner } from '@/components/ui/Spinner';
import { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

type Payment = RevenueReport['payments'][number];

export default function RevenueReportPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });

  const { data, isLoading } = useQuery<RevenueReport>({
    queryKey: ['revenue-report', params],
    queryFn: async () => (await api.get('/web/admin/reports/revenue', { params })).data.data,
  });

  const columns: ColumnDef<Payment, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toLocaleString()}` },
    { accessorKey: 'method', header: 'Method' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => dayjs(row.original.date).format('DD MMM YYYY') },
  ];

  const chartData = data ? Object.entries(data.byMethod).map(([method, amount]) => ({ method, amount })) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Revenue Report</h2>

      <div className="flex gap-3 items-end">
        <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ from, to })}><Search size={14} /> Apply</Button>
      </div>

      {isLoading ? <PageSpinner /> : (
        <>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Revenue by Payment Method</h3>
              <p className="text-lg font-bold text-emerald-600">Total: ₹{data?.total.toLocaleString()}</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataTable data={data?.payments ?? []} columns={columns} />
        </>
      )}
    </div>
  );
}
