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
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manager-wide metrics and performance overview</p>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tickets"
            value={data.totalTickets}
            icon={Ticket}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            accentColor="bg-slate-400"
            subtitle="All tickets in system"
          />
          <StatsCard
            title="New Tickets"
            value={data.newTickets}
            icon={ClipboardList}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            accentColor="bg-violet-500"
            subtitle="Awaiting assignment"
          />
          <StatsCard
            title="Assigned"
            value={data.assignedTickets}
            icon={ClipboardCheck}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            accentColor="bg-blue-500"
            subtitle="Assigned to technicians"
          />
          <StatsCard
            title="In Progress"
            value={data.inProgressTickets}
            icon={Clock}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            accentColor="bg-orange-500"
            subtitle="Currently active tasks"
          />
          <StatsCard
            title="Pending"
            value={data.pendingTickets}
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            accentColor="bg-amber-500"
            subtitle="On hold or blocked"
          />
          <StatsCard
            title="Completed"
            value={data.completedTickets}
            icon={CheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            accentColor="bg-emerald-500"
            subtitle="Successfully resolved"
          />
          <StatsCard
            title="Technicians"
            value={data.totalTechnicians}
            icon={Users}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            accentColor="bg-indigo-500"
            subtitle="Active service agents"
          />
          <StatsCard
            title="Pending Payments"
            value={`₹${data.pendingPayments.toLocaleString()}`}
            icon={DollarSign}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            accentColor="bg-rose-500"
            subtitle="Unpaid invoices total"
          />
        </div>
      )}
    </div>
  );
}
