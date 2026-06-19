'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Receipt, FileText, Activity, Zap, History, BarChart2, ClipboardCheck, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: Receipt },
  { href: '/super-admin/payment-requests', label: 'Payment Requests', icon: ClipboardCheck },
  { href: '/super-admin/billing', label: 'Billing', icon: FileText },
  { href: '/super-admin/payment-history', label: 'Payment History', icon: History },
  { href: '/super-admin/revenue-reports', label: 'Revenue Reports', icon: BarChart2 },
  { href: '/super-admin/activity-logs', label: 'Activity Logs', icon: Activity },
  { href: '/super-admin/platform-settings', label: 'Platform Settings', icon: Settings },
];

interface SuperAdminSidebarProps { onClose?: () => void; }

export function SuperAdminSidebar({ onClose }: SuperAdminSidebarProps) {
  const path = usePathname();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">FieldEaze</p>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
