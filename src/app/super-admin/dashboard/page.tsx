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
            context="+1 tenant onboarded this month"
            status="growing"
            footerText="Updated 2 mins ago"
          />

          {/* ── Standard: Active Tenants ── */}
          <StatsCard
            variant="standard"
            title="Active Tenants"
            value={data.activeTenants}
            icon={CheckCircle}
            accentHex={ACCENT}
            context="All subscriptions are active"
            status="healthy"
            footerText="Live"
          />

          {/* ── Primary: Total Revenue ── */}
          <StatsCard
            variant="primary"
            title="Total Revenue"
            value={`₹${data.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            accentHex={ACCENT}
            context="₹250 collected today"
            trend={{ label: '+12%', direction: 'up' }}
            status="healthy"
            footerText="Updated just now"
          />

          {/* ── Status: Expired Tenants ── */}
          <StatsCard
            variant="status"
            title="Expired Tenants"
            value={data.expiredTenants}
            icon={AlertCircle}
            accentHex={ACCENT}
            context="No renewals currently pending"
            status="healthy"
            footerText="Synced just now"
          />

          {/* ── Status: Suspended Tenants ── */}
          <StatsCard
            variant="status"
            title="Suspended Tenants"
            value={data.suspendedTenants}
            icon={XCircle}
            accentHex={ACCENT}
            context="No suspended accounts"
            status="stable"
            footerText="Live Data"
          />

          {/* ── Standard: Active Users ── */}
          <StatsCard
            variant="standard"
            title="Active Users"
            value={data.activeUsers}
            icon={Users}
            accentHex={ACCENT}
            context="12 users currently online"
            status="live"
            footerText="Live"
          />

        </div>
      )}
    </div>
  );
}
