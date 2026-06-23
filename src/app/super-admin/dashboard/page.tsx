'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, AlertCircle, DollarSign, Users } from 'lucide-react';
import api from '@/lib/axios';
import { SuperAdminDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { SkeletonCard } from '@/components/ui/Spinner';

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery<SuperAdminDashboard>({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => (await api.get('/web/super-admin/dashboard')).data.data,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide metrics and performance overview</p>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <StatsCard
            title="Total Tenants"
            value={data.totalTenants}
            icon={Building2}
            iconBg="bg-slate-100"
            iconColor="text-slate-650"
            accentColor="bg-slate-400"
            subtitle="All registered tenants"
          />
          <StatsCard
            title="Active Tenants"
            value={data.activeTenants}
            icon={CheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Currently active subscriptions"
          />
          <StatsCard
            title="Expired Tenants"
            value={data.expiredTenants}
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            accentColor="bg-amber-500"
            subtitle="Subscriptions that lapsed"
          />
          <StatsCard
            title="Suspended Tenants"
            value={data.suspendedTenants}
            icon={XCircle}
            iconBg="bg-red-50"
            iconColor="text-red-655"
            accentColor="bg-red-500"
            subtitle="Manually suspended accounts"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${data.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Lifetime collected revenue"
          />
          <StatsCard
            title="Active Users"
            value={data.activeUsers}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-650"
            accentColor="bg-blue-500"
            subtitle="Users across all tenants"
          />
        </div>
      )}
    </div>
  );
}
