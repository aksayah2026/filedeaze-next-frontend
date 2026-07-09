'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, AlertCircle, DollarSign, Users } from 'lucide-react';
import api from '@/lib/axios';
import { SuperAdminDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { SkeletonCard } from '@/components/ui/Spinner';
import { useRoleAccent } from '@/lib/useRoleAccent';

export default function SuperAdminDashboardPage() {
  const ACCENT = useRoleAccent();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ── Standard: Total Tenants ── */}
          <StatsCard
            variant="standard"
            title="Total Tenants"
            value={data.totalTenants}
            icon={Building2}
            accentHex={ACCENT}
            context="Total onboarded companies"
            status="stable"
            footerText="Platform Total"
          />

          {/* ── Standard: Active Tenants ── */}
          <StatsCard
            variant="standard"
            title="Active Tenants"
            value={data.activeTenants}
            icon={CheckCircle}
            accentHex={ACCENT}
            context={`${((data.activeTenants / (data.totalTenants || 1)) * 100).toFixed(0)}% of tenants active`}
            status={data.activeTenants > 0 ? 'healthy' : 'offline'}
            footerText="Live"
          />

          {/* ── Primary: Total Revenue ── */}
          <StatsCard
            variant="primary"
            title="Total Revenue"
            value={`₹${data.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            accentHex={ACCENT}
            context="Accumulated platform earnings"
            status="healthy"
            footerText="Platform Total"
          />

          {/* ── Status: Expired Tenants ── */}
          <StatsCard
            variant="status"
            title="Expired Tenants"
            value={data.expiredTenants}
            icon={AlertCircle}
            accentHex={ACCENT}
            context={data.expiredTenants > 0 ? `${data.expiredTenants} expired subscriptions` : "No pending renewals"}
            status={data.expiredTenants > 0 ? 'critical' : 'healthy'}
            footerText="Sync Status"
          />

          {/* ── Status: Suspended Tenants ── */}
          <StatsCard
            variant="status"
            title="Suspended Tenants"
            value={data.suspendedTenants}
            icon={XCircle}
            accentHex={ACCENT}
            context={data.suspendedTenants > 0 ? `${data.suspendedTenants} suspended accounts` : "All accounts in good standing"}
            status={data.suspendedTenants > 0 ? 'attention' : 'stable'}
            footerText="Live Status"
          />

          {/* ── Standard: Active Users ── */}
          <StatsCard
            variant="standard"
            title="Active Users"
            value={data.activeUsers}
            icon={Users}
            accentHex={ACCENT}
            context={`${data.activeUsers} users currently active`}
            status={data.activeUsers > 0 ? 'active' : 'inactive'}
            footerText="Real-time"
          />
        </div>
      )}
    </div>
  );
}
