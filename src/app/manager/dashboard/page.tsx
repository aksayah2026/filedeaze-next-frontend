'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Ticket, Users, DollarSign, ClipboardCheck, ClipboardList, Clock, AlertCircle, AlertTriangle, CheckCircle, CalendarCheck } from 'lucide-react';
import api from '@/lib/axios';
import { ManagerDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useRoleAccent } from '@/lib/useRoleAccent';

export default function ManagerDashboardPage() {
  const accent = useRoleAccent();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<ManagerDashboard>({
    queryKey: ['manager-dashboard'],
    queryFn: async () => (await api.get('/web/manager/dashboard')).data.data,
  });

  return (
    <div className="space-y-6 animate-fe-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors duration-250">Dashboard</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5 transition-colors duration-250">Manager-wide metrics and performance overview</p>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm max-w-xl space-y-5">
            <SkeletonLine className="w-48 h-5 mb-4" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
          </div>
        </div>
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={refetch} isRetrying={isFetching} />
      ) : (
        <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tickets"
            value={data.totalTickets}
            icon={Ticket}
            accentHex={accent}
            context="All tickets in system"
            status="live"
            footerText="Live"
          />
          <StatsCard
            title="New Tickets"
            value={data.newTickets}
            icon={ClipboardList}
            accentHex={accent}
            context="Awaiting assignment"
            status="attention"
            footerText="Live"
          />
          <StatsCard
            title="Assigned Tickets"
            value={data.assignedTickets}
            icon={ClipboardCheck}
            accentHex={accent}
            context="5 assigned today"
            status="ontrack"
            footerText="Updated 2 mins ago"
          />
          <StatsCard
            title="In Progress"
            value={data.inProgressTickets}
            icon={Clock}
            accentHex={accent}
            context="Currently active tasks"
            status="live"
            footerText="Live"
          />
          <StatsCard
            title="Pending Jobs"
            value={data.pendingTickets}
            icon={AlertCircle}
            accentHex={accent}
            context="2 overdue tasks"
            status="attention"
            footerText="Live"
          />
          <StatsCard
            title="Completed"
            value={data.completedTickets}
            icon={CheckCircle}
            accentHex={accent}
            context="12 completed successfully"
            status="completed"
            footerText="Updated now"
          />
          <StatsCard
            title="Active Technicians"
            value={data.totalTechnicians}
            icon={Users}
            accentHex={accent}
            context="10 currently on duty"
            status="online"
            footerText="Live"
          />
          <StatsCard
            title="Collections Today"
            value={`₹${data.pendingPayments.toLocaleString()}`}
            icon={DollarSign}
            accentHex={accent}
            context="₹2,500 collected this morning"
            status="growing"
            footerText="Updated now"
          />
        </div>

          {/* Ticket Assignment Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Ticket Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Pending Tickets"
                value={data.newTickets}
                icon={ClipboardList}
                accentHex={accent}
                context="Awaiting assignment"
                status="attention"
                footerText="Live"
              />
              <StatsCard
                title="Assigned Tickets"
                value={data.assignedTickets}
                icon={ClipboardCheck}
                accentHex={accent}
                context="5 assigned today"
                status="ontrack"
                footerText="Updated 2 mins ago"
              />
              <Link href="/manager/tickets?expired=true" className="block">
                <StatsCard
                  title="Rework Requests"
                  value={data.expiredAssignments}
                  icon={AlertTriangle}
                  accentHex={accent}
                  context="1 raised today"
                  status="review"
                  footerText="Updated today"
                />
              </Link>
              <StatsCard
                title="Today's Visits"
                value={data.completedToday}
                icon={CalendarCheck}
                accentHex={accent}
                context="12 completed successfully"
                status="completed"
                footerText="Updated now"
              />
            </div>
          </div>

          {/* Plan Usage Section */}
          <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none max-w-xl transition-colors duration-250">
            <div className="absolute left-0 top-0 right-0 h-1 bg-[var(--color-primary)] rounded-t-xl" />
            <h3 className="flex items-center justify-between gap-2 mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Plan Resource Usage</span>
              {data.planUsage && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary-ring)]">
                  {data.planUsage.plan}
                </span>
              )}
            </h3>
            {data.planUsage ? (
              <div className="space-y-5">
                <ProgressBar label="Managers"           used={data.planUsage.usage.managers.current}    limit={data.planUsage.usage.managers.limit} />
                <ProgressBar label="Technicians"        used={data.planUsage.usage.technicians.current} limit={data.planUsage.usage.technicians.limit} />
                <ProgressBar label="Tickets (this month)" used={data.planUsage.usage.tickets.current}  limit={data.planUsage.usage.tickets.limit} />
                {data.planUsage.usage.customers && (
                  <ProgressBar label="Customers" used={data.planUsage.usage.customers.current} limit={data.planUsage.usage.customers.limit} />
                )}
                <ProgressBar label="Storage" used={data.planUsage.usage.storage.current} limit={data.planUsage.usage.storage.limit} unit=" GB" />
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--color-text-muted)]">
                <p className="text-sm">No active subscription plan allocated.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
