'use client';

import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, DollarSign, UserCheck } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fe-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Tenant-wide metrics and resource usage overview</p>
      </div>

      {/* Main Content Areas */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm max-w-xl space-y-5">
            <SkeletonLine className="w-48 h-5 mb-4" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
            <SkeletonLine className="w-full h-6" />
          </div>
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatsCard
              title="Total Tickets"
              value={data.totalTickets}
              icon={Ticket}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              accentColor="bg-slate-400"
              subtitle="All-time created tickets"
            />
            <StatsCard
              title="Open Tickets"
              value={data.openTickets}
              icon={Ticket}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              accentColor="bg-orange-500"
              subtitle="Currently active/pending tickets"
            />
            <StatsCard
              title="Total Technicians"
              value={data.totalTechnicians}
              icon={Users}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              accentColor="bg-emerald-500"
              subtitle="Registered service providers"
            />
            <StatsCard
              title="Total Customers"
              value={data.totalCustomers}
              icon={UserCheck}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              accentColor="bg-purple-500"
              subtitle="Registered client profiles"
            />
            <StatsCard
              title="Monthly Revenue"
              value={`₹${data.monthlyRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              accentColor="bg-emerald-500"
              subtitle="Collected revenue this month"
            />
          </div>

          {/* Plan Usage Section */}
          <div className="relative overflow-hidden bg-white rounded-xl p-6 border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-w-xl group">
            {/* Top accent bar */}
            <div className="absolute left-0 top-0 right-0 h-1 bg-blue-500 rounded-t-xl" />
            
            <h3 className="font-bold text-slate-900 flex items-center justify-between gap-2 mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Plan Resource Usage</span>
              {data.planUsage && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
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
              <div className="text-center py-6 text-slate-400">
                <p className="text-sm">No active subscription plan allocated.</p>
                <p className="text-xs mt-1 text-slate-400">Please assign a plan from the Super Admin portal.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
