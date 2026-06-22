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
  { href: '/admin/dashboard',            label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/managers',             label: 'Managers',          icon: Users },
  { href: '/admin/company-settings',     label: 'Company Settings',  icon: Building2 },
  { href: '/admin/tenant-settings',      label: 'Tenant Settings',   icon: Settings },
  { href: '/admin/profile',              label: 'My Profile',        icon: UserCheck },
];

const reportsNav = [
  { href: '/admin/reports/revenue',      label: 'Revenue',           icon: BarChart2 },
  { href: '/admin/reports/tickets',      label: 'Tickets',           icon: ClipboardList },
  { href: '/admin/reports/technicians',  label: 'Technicians',       icon: Users },
];

const adminMiscNav = [
  { href: '/admin/audit-logs',           label: 'Audit Logs',        icon: FileText },
  { href: '/admin/platform-settings',    label: 'Platform Settings', icon: Settings },
  { href: '/admin/subscription',         label: 'Subscription',      icon: CreditCard },
];

const operationsNav = [
  { href: '/manager/tickets',               label: 'Tickets',          icon: Ticket },
  { href: '/manager/technicians',           label: 'Technicians',      icon: Wrench },
  { href: '/manager/skills',               label: 'Skills',            icon: Star },
  { href: '/manager/service-categories',   label: 'Categories',       icon: Tag },
  { href: '/manager/service-sub-categories', label: 'Sub-Categories', icon: Tag },
  { href: '/manager/customers',            label: 'Customers',        icon: Users },
  { href: '/manager/attendance',           label: 'Attendance',       icon: UserCheck },
  { href: '/manager/feedback',             label: 'Feedback',         icon: Star },
  { href: '/manager/payments',             label: 'Payments',         icon: CreditCard },
  { href: '/manager/invoices',             label: 'Invoices',         icon: Receipt },
  { href: '/manager/offers',               label: 'Offers',           icon: Gift },
];

const managerDashNav = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

function NavItem({
  href, label, icon: Icon, isActive, onClick,
}: { href: string; label: string; icon: React.ElementType; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 mb-0.5',
        isActive ? 'nav-item-active text-white' : 'text-slate-400 hover:text-white'
      )}
      style={isActive ? { background: 'rgba(37, 99, 235, 0.2)' } : undefined}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1E293B'; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <span className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors',
        isActive ? 'bg-blue-600/30' : 'bg-white/5'
      )}>
        <Icon size={15} className={isActive ? 'text-blue-300' : 'text-slate-400'} />
      </span>
      <span className="truncate">{label}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
      {label}
    </p>
  );
}

interface AdminSidebarProps { onClose?: () => void; }

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const path = usePathname();
  const { role } = useAuth();
  const isActive = (href: string) => path === href || path.startsWith(href + '/');

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col" style={{ background: '#0F172A' }}>
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
        >
          <Zap size={17} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">FieldEaze</p>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: '#94A3B8' }}>
            {role === 'ADMIN' ? 'Admin Portal' : 'Manager Portal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0">
        {role === 'ADMIN' && (
          <>
            <SectionLabel label="Admin" />
            {adminOnlyNav.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
            ))}
            <SectionLabel label="Reports" />
            {reportsNav.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
            ))}
            {adminMiscNav.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}

        {role === 'MANAGER' && (
          <>
            <SectionLabel label="Overview" />
            {managerDashNav.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}

        <SectionLabel label="Operations" />
        {operationsNav.map(item => (
          <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
        ))}
      </nav>

      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-medium" style={{ color: '#475569' }}>
          FieldEaze Platform v1.0
        </p>
      </div>
    </aside>
  );
}
