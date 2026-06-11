'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, ClipboardCheck, ClipboardList, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { ManagerDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ManagerDashboardPage() {
  const { data, isLoading } = useQuery<ManagerDashboard>({
    queryKey: ['manager-dashboard'],
    queryFn: async () => (await api.get('/web/manager/dashboard')).data.data,
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Total Tickets" value={data.totalTickets} icon={Ticket} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard title="New Tickets" value={data.newTickets} icon={ClipboardList} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatsCard title="Assigned" value={data.assignedTickets} icon={ClipboardCheck} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatsCard title="In Progress" value={data.inProgressTickets} icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <StatsCard title="Pending" value={data.pendingTickets} icon={AlertCircle} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatsCard title="Completed" value={data.completedTickets} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatsCard title="Technicians" value={data.totalTechnicians} icon={Users} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatsCard title="Pending Payments" value={`₹${data.pendingPayments.toLocaleString()}`} icon={DollarSign} iconBg="bg-red-50" iconColor="text-red-600" />
      </div>
    </div>
  );
}
