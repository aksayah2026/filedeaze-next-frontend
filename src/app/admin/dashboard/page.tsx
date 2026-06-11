'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, UserCheck } from 'lucide-react';
import api from '@/lib/axios';
import { AdminDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/web/admin/dashboard')).data.data,
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard title="Total Tickets" value={data.totalTickets} icon={Ticket} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard title="Open Tickets" value={data.openTickets} icon={Ticket} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <StatsCard title="Total Technicians" value={data.totalTechnicians} icon={Users} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatsCard title="Total Customers" value={data.totalCustomers} icon={UserCheck} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatsCard title="Monthly Revenue" value={`₹${data.monthlyRevenue.toLocaleString()}`} icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm max-w-xl">
        <h3 className="font-medium text-gray-700 mb-5">
          Plan Usage {data.planUsage && <span className="text-xs text-gray-400 font-normal ml-1">({data.planUsage.plan})</span>}
        </h3>
        {data.planUsage ? (
          <div className="space-y-4">
            <ProgressBar label="Managers" used={data.planUsage.usage.managers.current} limit={data.planUsage.usage.managers.limit} />
            <ProgressBar label="Technicians" used={data.planUsage.usage.technicians.current} limit={data.planUsage.usage.technicians.limit} />
            <ProgressBar label="Tickets" used={data.planUsage.usage.tickets.current} limit={data.planUsage.usage.tickets.limit} />
            <ProgressBar label="Storage" used={data.planUsage.usage.storage.current} limit={data.planUsage.usage.storage.limit} unit=" GB" />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active subscription. Assign a plan from the Super Admin portal.</p>
        )}
      </div>
    </div>
  );
}
