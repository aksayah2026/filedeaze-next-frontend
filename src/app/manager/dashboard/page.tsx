'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, ClipboardCheck, ClipboardList, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { ManagerDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Spinner';

export default function ManagerDashboardPage() {
  const { data, isLoading } = useQuery<ManagerDashboard>({
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
      ) : !data ? null : (
        <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tickets"
            value={data.totalTickets}
            icon={Ticket}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-[var(--color-text-secondary)]"
            accentColor="bg-[var(--color-surface-elevated)]"
            subtitle="All tickets in system"
          />
          <StatsCard
            title="New Tickets"
            value={data.newTickets}
            icon={ClipboardList}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-violet-650"
            accentColor="bg-violet-500"
            subtitle="Awaiting assignment"
          />
          <StatsCard
            title="Assigned"
            value={data.assignedTickets}
            icon={ClipboardCheck}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-blue-650"
            accentColor="bg-blue-500"
            subtitle="Assigned to technicians"
          />
          <StatsCard
            title="In Progress"
            value={data.inProgressTickets}
            icon={Clock}
            iconBg="bg-orange-50"
            iconColor="text-orange-655"
            accentColor="bg-orange-500"
            subtitle="Currently active tasks"
          />
          <StatsCard
            title="Pending"
            value={data.pendingTickets}
            icon={AlertCircle}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-amber-655"
            accentColor="bg-amber-500"
            subtitle="On hold or blocked"
          />
          <StatsCard
            title="Completed"
            value={data.completedTickets}
            icon={CheckCircle}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Successfully resolved"
          />
          <StatsCard
            title="Technicians"
            value={data.totalTechnicians}
            icon={Users}
            iconBg="bg-[var(--color-surface-elevated)]"
            iconColor="text-indigo-655"
            accentColor="bg-indigo-500"
            subtitle="Active service agents"
          />
          <StatsCard
            title="Pending Payments"
            value={`₹${data.pendingPayments.toLocaleString()}`}
            icon={DollarSign}
            iconBg="bg-rose-50"
            iconColor="text-rose-655"
            accentColor="bg-rose-500"
            subtitle="Unpaid invoices total"
          />
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
