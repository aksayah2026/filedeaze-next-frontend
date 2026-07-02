'use client';

import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  CreditCardIcon,
  WalletIcon,
  HandCoinsIcon,
  ChartBarIcon,
  ClipboardIcon,
  SettingsIcon,
  ActivityIcon,
} from '@animateicons/react/lucide';
import { cn } from '@/lib/utils';
import { SidebarNavItem } from './SidebarNavItem';
import type { NavItemDef } from './SidebarNavItem';

const nav: (NavItemDef & { section: string })[] = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: DashboardIcon, section: 'Overview' },
  { href: '/super-admin/tenants', label: 'Tenants', icon: ChartBarIcon, section: 'Management' },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCardIcon, section: 'Management' },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: WalletIcon, section: 'Management' },
  { href: '/super-admin/payment-requests', label: 'Payment Requests', icon: HandCoinsIcon, section: 'Management' },
  { href: '/super-admin/billing', label: 'Billing', icon: ClipboardIcon, section: 'Finance' },
  { href: '/super-admin/payment-history', label: 'Payment History', icon: HandCoinsIcon, section: 'Finance' },
  { href: '/super-admin/revenue-reports', label: 'Revenue Reports', icon: ChartBarIcon, section: 'Finance' },
  { href: '/super-admin/activity-logs', label: 'Activity Logs', icon: ActivityIcon, section: 'System' },
  { href: '/super-admin/platform-settings', label: 'Platform Settings', icon: SettingsIcon, section: 'System' },
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
        <img
          src="/fieldeaze_logo.png"
          alt="FieldEaze Logo"
          className="h-9 w-9 shrink-0 transition-transform duration-300 object-contain"
        />
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
      <nav className="flex-1 flex flex-col overflow-y-auto sidebar-scroll py-3 px-3 space-y-0.5">
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
              {items.map(item => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={path === item.href || path.startsWith(item.href + '/')}
                  isCollapsed={isCollapsed}
                  onClose={onClose}
                />
              ))}
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
