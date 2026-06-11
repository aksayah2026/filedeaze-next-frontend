'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { TicketReport, TicketStatus } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

const COLORS = ['#3b82f6', '#f59e0b', '#06b6d4', '#f97316', '#8b5cf6', '#6366f1', '#84cc16', '#10b981', '#14b8a6', '#6b7280', '#ef4444'];

export default function TicketsReportPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [params, setParams] = useState({ from: monthStart, to: today });

  const { data, isLoading } = useQuery<TicketReport>({
    queryKey: ['tickets-report', params],
    queryFn: async () => (await api.get('/web/admin/reports/tickets', { params })).data.data,
  });

  const chartData = data
    ? Object.entries(data.byStatus).map(([status, count]) => ({ name: (status as TicketStatus).replace(/_/g, ' '), value: count }))
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Ticket Report</h2>

      <div className="flex gap-3 items-end">
        <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ from, to })}><Search size={14} /> Apply</Button>
      </div>

      {isLoading ? <PageSpinner /> : (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm max-w-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
