'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Settings, Users, BarChart2, FileText,
  ClipboardList, Wrench, Tag, Ticket, UserCheck, Star,
  CreditCard, Receipt, Gift, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const adminOnlyNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/managers', label: 'Managers', icon: Users },
  { href: '/admin/company-settings', label: 'Company Settings', icon: Building2 },
  { href: '/admin/tenant-settings', label: 'Tenant Settings', icon: Settings },
  { href: '/admin/profile', label: 'My Profile', icon: UserCheck },
];

const reportsNav = [
  { href: '/admin/reports/revenue', label: 'Revenue', icon: BarChart2 },
  { href: '/admin/reports/tickets', label: 'Tickets', icon: ClipboardList },
  { href: '/admin/reports/technicians', label: 'Technicians', icon: Users },
];

const adminMiscNav = [
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/platform-settings', label: 'Platform Settings', icon: Settings },
  { href: '/admin/subscription', label: 'Subscription', icon: CreditCard },
];

const operationsNav = [
  { href: '/manager/tickets', label: 'Tickets', icon: Ticket },
  { href: '/manager/technicians', label: 'Technicians', icon: Wrench },
  { href: '/manager/skills', label: 'Skills', icon: Star },
  { href: '/manager/service-categories', label: 'Categories', icon: Tag },
  { href: '/manager/service-sub-categories', label: 'Sub-Categories', icon: Tag },
  { href: '/manager/customers', label: 'Customers', icon: Users },
  { href: '/manager/attendance', label: 'Attendance', icon: UserCheck },
  { href: '/manager/feedback', label: 'Feedback', icon: Star },
  { href: '/manager/payments', label: 'Payments', icon: CreditCard },
  { href: '/manager/invoices', label: 'Invoices', icon: Receipt },
  { href: '/manager/offers', label: 'Offers', icon: Gift },
];

const managerDashNav = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

interface AdminSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function AdminSidebar({ onClose, isCollapsed = false }: AdminSidebarProps) {
  const path = usePathname();
  const { role } = useAuth();
  const isActive = (href: string) => path === href || path.startsWith(href + '/');

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        title={isCollapsed ? item.label : undefined}
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
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  };

  const renderSectionHeader = (label: string, showDivider: boolean) => {
    if (isCollapsed) {
      return showDivider ? <div className="h-px bg-[var(--color-border-strong)] my-3 mx-2 opacity-30" /> : null;
    }
    return (
      <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </p>
    );
  };

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
              {role === 'ADMIN' ? 'Admin Portal' : 'Manager Portal'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0.5">
        {role === 'ADMIN' && (
          <>
            {renderSectionHeader("Admin", false)}
            {adminOnlyNav.map(item => renderNavItem(item))}

            {renderSectionHeader("Reports", true)}
            {reportsNav.map(item => renderNavItem(item))}

            {renderSectionHeader("System", true)}
            {adminMiscNav.map(item => renderNavItem(item))}
          </>
        )}

        {role === 'MANAGER' && (
          <>
            {renderSectionHeader("Overview", false)}
            {managerDashNav.map(item => renderNavItem(item))}
          </>
        )}

        {renderSectionHeader("Operations", true)}
        {operationsNav.map(item => renderNavItem(item))}
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
