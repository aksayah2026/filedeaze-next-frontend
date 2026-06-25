'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { AdminDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Spinner';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/web/admin/dashboard')).data.data,
  });

  const sub = data?.subscription;
  const showTrialBanner = sub?.isTrial;

  return (
    <div className="space-y-6 animate-fe-fade-in">
      {/* Trial Banner */}
      {showTrialBanner && (
        <div className="flex items-center gap-3 bg-[var(--color-surface-elevated)] border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            You are on a <strong>{sub?.currentPlan?.name ?? 'STARTER'}</strong> free trial.{' '}
            {sub?.trialDaysLeft != null && sub.trialDaysLeft > 0
              ? <><strong>{sub.trialDaysLeft} day{sub.trialDaysLeft !== 1 ? 's' : ''}</strong> remaining.</>
              : <strong>Trial has ended.</strong>}{' '}
            <Link href="/admin/subscription" className="underline font-medium">Subscribe now</Link> to keep access.
          </span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors duration-250">Dashboard</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5 transition-colors duration-250">Tenant-wide metrics and resource usage overview</p>
      </div>

      {/* Main Content Areas */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm max-w-xl space-y-5 transition-colors duration-250">
            <SkeletonLine className="w-48 h-5 mb-4" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
          </div>
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <StatsCard
              title="Total Tickets"
              value={data.totalTickets}
              icon={Ticket}
              iconBg="bg-[var(--color-surface-elevated)]"
              iconColor="text-[var(--color-text-secondary)]"
              accentColor="bg-[var(--color-surface-elevated)]"
              subtitle="All-time created tickets"
            />
            <StatsCard
              title="Open Tickets"
              value={data.openTickets}
              icon={Ticket}
              iconBg="bg-orange-50"
              iconColor="text-orange-655"
              accentColor="bg-orange-500"
              subtitle="Currently active/pending tickets"
            />
            <StatsCard
              title="Total Technicians"
              value={data.totalTechnicians}
              icon={Users}
              iconBg="bg-[var(--color-surface-elevated)]"
              iconColor="text-emerald-600"
              accentColor="bg-emerald-500"
              subtitle="Registered service providers"
            />
            <StatsCard
              title="Total Customers"
              value={data.totalCustomers}
              icon={UserCheck}
              iconBg="bg-purple-50"
              iconColor="text-purple-655"
              accentColor="bg-purple-500"
              subtitle="Registered client profiles"
            />
            <StatsCard
              title="Monthly Revenue"
              value={`₹${data.monthlyRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconBg="bg-[var(--color-surface-elevated)]"
              iconColor="text-green-600"
              accentColor="bg-emerald-500"
              subtitle="Collected revenue this month"
            />
          </div>

          {/* Plan Usage Section */}
          <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none max-w-xl group transition-colors duration-250">
            {/* Top accent bar */}
            <div className="absolute left-0 top-0 right-0 h-1 bg-[var(--color-primary)] rounded-t-xl" />

            <h3 className="font-bold text-[var(--color-text-primary)] flex items-center justify-between gap-2 mb-6 transition-colors duration-250">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Plan Resource Usage</span>
              {data.planUsage && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary-ring)]">
                  {data.planUsage.plan}
                </span>
              )}
            </h3>

            {data.planUsage ? (
              <div className="space-y-5">
                <ProgressBar
                  label="Managers"
                  used={data.planUsage.usage.managers.current}
                  limit={data.planUsage.usage.managers.limit}
                />
                <ProgressBar
                  label="Technicians"
                  used={data.planUsage.usage.technicians.current}
                  limit={data.planUsage.usage.technicians.limit}
                />
                <ProgressBar
                  label="Tickets"
                  used={data.planUsage.usage.tickets.current}
                  limit={data.planUsage.usage.tickets.limit}
                />
                <ProgressBar
                  label="Storage"
                  used={data.planUsage.usage.storage.current}
                  limit={data.planUsage.usage.storage.limit}
                  unit=" GB"
                />
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--color-text-muted)]">
                <p className="text-sm">No active subscription plan allocated.</p>
                <p className="text-xs mt-1 text-[var(--color-text-muted)]">Please assign a plan from the Super Admin portal.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
