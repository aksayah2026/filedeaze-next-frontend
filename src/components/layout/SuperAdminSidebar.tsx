'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Receipt, FileText,
  Activity, Zap, History, BarChart2, ClipboardCheck, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { href: '/super-admin/tenants', label: 'Tenants', icon: Building2, section: 'Management' },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCard, section: 'Management' },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: Receipt, section: 'Management' },
  { href: '/super-admin/payment-requests', label: 'Payment Requests', icon: ClipboardCheck, section: 'Management' },
  { href: '/super-admin/billing', label: 'Billing', icon: FileText, section: 'Finance' },
  { href: '/super-admin/payment-history', label: 'Payment History', icon: History, section: 'Finance' },
  { href: '/super-admin/revenue-reports', label: 'Revenue Reports', icon: BarChart2, section: 'Finance' },
  { href: '/super-admin/activity-logs', label: 'Activity Logs', icon: Activity, section: 'System' },
  { href: '/super-admin/platform-settings', label: 'Platform Settings', icon: Settings, section: 'System' },
];

const sections = ['Overview', 'Management', 'Finance', 'System'];

interface SuperAdminSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function SuperAdminSidebar({ onClose, isCollapsed = false }: SuperAdminSidebarProps) {
  const path = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out select-none bg-[var(--color-sidebar)]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 h-16 shrink-0 transition-all duration-300 bg-[var(--color-header-bg)] shadow-sm",
          isCollapsed ? "justify-center px-4" : "justify-start"
        )}
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
            boxShadow: '0 4px 12px var(--color-primary-ring)',
          }}
        >
          <Zap size={17} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-fe-slide-left">
            <p className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">FieldEaze</p>
            <p className="text-[10px] font-semibold mt-0.5 text-[var(--color-text-muted)]">
              Super Admin
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0.5">
        {sections.map((section, secIdx) => {
          const items = nav.filter(n => n.section === section);

          return (
            <div key={section} className="mb-3">
              {isCollapsed ? (
                secIdx > 0 && <div className="h-px bg-[var(--color-border-strong)] my-3 mx-2 opacity-30" />
              ) : (
                <p className="px-2 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {section}
                </p>
              )}
              {items.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    title={isCollapsed ? label : undefined}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 mb-0.5 group',
                      isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full',
                      active
                        ? 'bg-[var(--color-sidebar-active)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar-hover)]'
                    )}
                  >
                    {/* Active left indicator */}
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-full bg-[var(--color-primary)]" />
                    )}
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-lg shrink-0 transition-colors',
                      active
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'
                    )}>
                      <Icon size={15} />
                    </span>
                    {!isCollapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
        <p className="text-[10px] font-medium text-center text-[var(--color-text-muted)]">
          {isCollapsed ? 'v1.0' : 'FieldEaze Platform v1.0'}
        </p>
      </div>
    </aside>
  );
}

