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
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors duration-250">Dashboard</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5 transition-colors duration-250">Platform-wide metrics and performance overview</p>
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
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-slate-650"
            accentColor="bg-[var(--color-surface-elevated)]"
            subtitle="All registered tenants"
          />
          <StatsCard
            title="Active Tenants"
            value={data.activeTenants}
            icon={CheckCircle}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Currently active subscriptions"
          />
          <StatsCard
            title="Expired Tenants"
            value={data.expiredTenants}
            icon={AlertCircle}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-amber-600"
            accentColor="bg-amber-500"
            subtitle="Subscriptions that lapsed"
          />
          <StatsCard
            title="Suspended Tenants"
            value={data.suspendedTenants}
            icon={XCircle}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-red-655"
            accentColor="bg-red-500"
            subtitle="Manually suspended accounts"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${data.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Lifetime collected revenue"
          />
          <StatsCard
            title="Active Users"
            value={data.activeUsers}
            icon={Users}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-blue-650"
            accentColor="bg-blue-500"
            subtitle="Users across all tenants"
          />
        </div>
      )}
    </div>
  );
}
