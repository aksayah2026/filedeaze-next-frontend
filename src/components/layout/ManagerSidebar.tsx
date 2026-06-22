'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wrench, Tag, Users, Ticket, UserCheck,
  Star, CreditCard, Receipt, Gift, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const overviewNav = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const operationsNav = [
  { href: '/manager/tickets', label: 'Tickets', icon: Ticket },
  { href: '/manager/technicians', label: 'Technicians', icon: Wrench },
  { href: '/manager/skills', label: 'Skills', icon: Star },
  { href: '/manager/customers', label: 'Customers', icon: Users },
  { href: '/manager/attendance', label: 'Attendance', icon: UserCheck },
  { href: '/manager/feedback', label: 'Feedback', icon: Star },
];

const catalogNav = [
  { href: '/manager/service-categories', label: 'Categories', icon: Tag },
  { href: '/manager/service-sub-categories', label: 'Sub Categories', icon: Tag },
];

const financeNav = [
  { href: '/manager/payments', label: 'Payments', icon: CreditCard },
  { href: '/manager/invoices', label: 'Invoices', icon: Receipt },
  { href: '/manager/offers', label: 'Offers', icon: Gift },
];

interface ManagerSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function ManagerSidebar({ onClose, isCollapsed = false }: ManagerSidebarProps) {
  const path = usePathname();
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
          'relative flex items-center rounded-lg transition-all duration-150 mb-0.5 group',
          isCollapsed
            ? 'justify-center p-2 h-10 w-10 mx-auto'
            : 'gap-3 px-3 py-2 text-[13px] font-medium',
          active ? 'text-white' : 'text-slate-400 hover:text-white'
        )}
        style={active ? { background: '#16A34A' } : undefined}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(34, 197, 94, 0.12)';
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLElement).style.background = '';
        }}
      >
        <span className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors',
          active ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'
        )}>
          <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
        </span>
        {!isCollapsed && (
          <span className="truncate animate-fe-slide-left">{item.label}</span>
        )}
        {active && !isCollapsed && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
        )}
      </Link>
    );
  };

  const renderSectionHeader = (label: string, showDivider: boolean) => {
    if (isCollapsed) {
      return showDivider ? <div className="h-px bg-slate-800/60 my-3 mx-2" /> : null;
    }
    return (
      <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ background: '#0B2E1A' }}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-5 transition-all duration-300",
          isCollapsed ? "justify-center px-4" : "justify-start"
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
          }}
        >
          <Zap size={17} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-fe-slide-left">
            <p className="text-sm font-bold text-white leading-tight">FieldEaze</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
              Manager Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0.5">
        {renderSectionHeader("Overview", false)}
        {overviewNav.map(item => renderNavItem(item))}

        {renderSectionHeader("Operations", true)}
        {operationsNav.map(item => renderNavItem(item))}

        {renderSectionHeader("Service Catalog", true)}
        {catalogNav.map(item => renderNavItem(item))}

        {renderSectionHeader("Finance", true)}
        {financeNav.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-medium text-center text-slate-500">
          {isCollapsed ? 'v1.0' : 'FieldEaze Platform v1.0'}
        </p>
      </div>
    </aside>
  );
}
