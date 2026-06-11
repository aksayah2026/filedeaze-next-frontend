'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, AlertCircle, DollarSign, Users } from 'lucide-react';
import api from '@/lib/axios';
import { SuperAdminDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageSpinner } from '@/components/ui/Spinner';

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery<SuperAdminDashboard>({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => (await api.get('/web/super-admin/dashboard')).data.data,
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard title="Total Tenants" value={data.totalTenants} icon={Building2} iconBg="bg-slate-100" iconColor="text-slate-600" />
        <StatsCard title="Active Tenants" value={data.activeTenants} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatsCard title="Expired Tenants" value={data.expiredTenants} icon={AlertCircle} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatsCard title="Suspended Tenants" value={data.suspendedTenants} icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatsCard title="Total Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatsCard title="Active Users" value={data.activeUsers} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>
    </div>
  );
}
