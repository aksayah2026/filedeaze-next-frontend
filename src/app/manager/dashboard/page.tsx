'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, ClipboardCheck, ClipboardList, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { ManagerDashboard } from '@/types';
import { StatsCard } from '@/components/ui/StatsCard';
import { SkeletonCard } from '@/components/ui/Spinner';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data ? null : (
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
      )}
    </div>
  );
}
