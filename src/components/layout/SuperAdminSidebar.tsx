'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Receipt, FileText,
  Activity, Zap, History, BarChart2, ClipboardCheck, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/super-admin/dashboard',        label: 'Dashboard',         icon: LayoutDashboard, section: 'Overview' },
  { href: '/super-admin/tenants',          label: 'Tenants',           icon: Building2,       section: 'Management' },
  { href: '/super-admin/plans',            label: 'Plans',             icon: CreditCard,      section: 'Management' },
  { href: '/super-admin/subscriptions',    label: 'Subscriptions',     icon: Receipt,         section: 'Management' },
  { href: '/super-admin/payment-requests', label: 'Payment Requests',  icon: ClipboardCheck,  section: 'Management' },
  { href: '/super-admin/billing',          label: 'Billing',           icon: FileText,        section: 'Finance' },
  { href: '/super-admin/payment-history',  label: 'Payment History',   icon: History,         section: 'Finance' },
  { href: '/super-admin/revenue-reports',  label: 'Revenue Reports',   icon: BarChart2,       section: 'Finance' },
  { href: '/super-admin/activity-logs',    label: 'Activity Logs',     icon: Activity,        section: 'System' },
  { href: '/super-admin/platform-settings',label: 'Platform Settings', icon: Settings,        section: 'System' },
];

const sections = ['Overview', 'Management', 'Finance', 'System'];

interface SuperAdminSidebarProps { onClose?: () => void; }

export function SuperAdminSidebar({ onClose }: SuperAdminSidebarProps) {
  const path = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col" style={{ background: '#0F172A' }}>
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
          <Zap size={17} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">FieldEaze</p>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: '#94A3B8' }}>Super Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0">
        {sections.map(section => {
          const items = nav.filter(n => n.section === section);
          return (
            <div key={section} className="mb-1">
              <p className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: '#475569' }}>
                {section}
              </p>
              {items.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 mb-0.5',
                      active
                        ? 'nav-item-active text-white'
                        : 'text-slate-400 hover:text-white'
                    )}
                    style={active
                      ? { background: 'rgba(37, 99, 235, 0.2)', color: '#fff' }
                      : undefined
                    }
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = '#1E293B';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors',
                      active ? 'bg-blue-600/30' : 'bg-white/5 group-hover:bg-white/10'
                    )}>
                      <Icon size={15} className={active ? 'text-blue-300' : 'text-slate-400'} />
                    </span>
                    <span className="truncate">{label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-medium" style={{ color: '#475569' }}>
          FieldEaze Platform v1.0
        </p>
      </div>
    </aside>
  );
}
