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

// Admin-only items
const adminOnlyNav = [
  { href: '/admin/dashboard',            label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/managers',             label: 'Managers',          icon: Users },
  { href: '/admin/company-settings',     label: 'Company Settings',  icon: Building2 },
  { href: '/admin/tenant-settings',      label: 'Tenant Settings',   icon: Settings },
  { href: '/admin/profile',              label: 'My Profile',        icon: UserCheck },
];

// Reports section (admin only)
const reportsNav = [
  { href: '/admin/reports/revenue',      label: 'Revenue',           icon: BarChart2 },
  { href: '/admin/reports/tickets',      label: 'Tickets',           icon: ClipboardList },
  { href: '/admin/reports/technicians',  label: 'Technicians',       icon: Users },
];

// Admin misc
const adminMiscNav = [
  { href: '/admin/audit-logs',           label: 'Audit Logs',        icon: FileText },
  { href: '/admin/platform-settings',    label: 'Platform Settings', icon: Settings },
  { href: '/admin/subscription',         label: 'Subscription',      icon: CreditCard },
];

// Operations — shared by admin + manager (manager routes)
const operationsNav = [
  { href: '/manager/tickets',             label: 'Tickets',          icon: Ticket },
  { href: '/manager/technicians',         label: 'Technicians',      icon: Wrench },
  { href: '/manager/skills',              label: 'Skills',            icon: Star },
  { href: '/manager/service-categories',  label: 'Categories',       icon: Tag },
  { href: '/manager/service-sub-categories', label: 'Sub-Categories', icon: Tag },
  { href: '/manager/customers',           label: 'Customers',        icon: Users },
  { href: '/manager/attendance',          label: 'Attendance',       icon: UserCheck },
  { href: '/manager/feedback',            label: 'Feedback',         icon: Star },
  { href: '/manager/payments',            label: 'Payments',         icon: CreditCard },
  { href: '/manager/invoices',            label: 'Invoices',         icon: Receipt },
  { href: '/manager/offers',              label: 'Offers',           icon: Gift },
];

// Manager-only dashboard (when logged in as MANAGER, not ADMIN)
const managerDashNav = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

function NavItem({ href, label, icon: Icon, isActive, onClick }: { href: string; label: string; icon: React.ElementType; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
        isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">FieldEaze</p>
          <p className="text-xs text-slate-400">{role === 'ADMIN' ? 'Admin Portal' : 'Manager Portal'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">

        {/* ── ADMIN section (admin only) ── */}
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

        {/* ── MANAGER section (manager role — show their own dashboard) ── */}
        {role === 'MANAGER' && (
          <>
            <SectionLabel label="Overview" />
            {managerDashNav.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}

        {/* ── Operations (admin + manager both) ── */}
        <SectionLabel label="Operations" />
        {operationsNav.map(item => (
          <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />
        ))}

      </nav>
    </aside>
  );
}
