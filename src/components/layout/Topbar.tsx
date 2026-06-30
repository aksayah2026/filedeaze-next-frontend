'use client';

import { LogOut, Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { getPortalPrefix } from '@/lib/auth-helper';

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
};

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: 'bg-[var(--color-surface-elevated)] text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  ADMIN: 'bg-[var(--color-surface-elevated)] text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  MANAGER: 'bg-[var(--color-surface-elevated)] text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
};

const breadcrumbLabels: Record<string, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'manager': 'Manager',
  'dashboard': 'Dashboard',
  'tenants': 'Tenants',
  'plans': 'Plans',
  'subscriptions': 'Subscriptions',
  'payment-requests': 'Payment Requests',
  'billing': 'Billing',
  'payment-history': 'Payment History',
  'revenue-reports': 'Revenue Reports',
  'activity-logs': 'Activity Logs',
  'platform-settings': 'Platform Settings',
  'managers': 'Managers',
  'company-settings': 'Company Settings',
  'tenant-settings': 'Tenant Settings',
  'profile': 'My Profile',
  'reports': 'Reports',
  'revenue': 'Revenue',
  'tickets': 'Tickets',
  'technicians': 'Technicians',
  'audit-logs': 'Audit Logs',
  'skills': 'Skills',
  'service-categories': 'Categories',
  'service-sub-categories': 'Sub Categories',
  'customers': 'Customers',
  'attendance': 'Attendance',
  'feedback': 'Feedback',
  'payments': 'Payments',
  'invoices': 'Invoices',
  'offers': 'Offers',
};

function getInitials(name?: string) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const avatarGradients = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
];

function getAvatarGradient(name?: string) {
  const code = name ? name.charCodeAt(0) : 0;
  return avatarGradients[code % avatarGradients.length];
}

export function Topbar({ title, onMenuClick, isCollapsed, onToggleCollapse }: TopbarProps) {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    const role = user?.role;
    const tenantCode = user?.tenantCode;
    try {
      const prefix = getPortalPrefix(pathname);
      const rt = localStorage.getItem(`${prefix}_refreshToken`);
      await api.post('/auth/logout', { refreshToken: rt });
    } catch { }
    clearAuth();
    toast.success('Logged out successfully');
    if (role === 'SUPER_ADMIN') {
      window.location.href = '/super-admin/login';
    } else if (tenantCode) {
      window.location.href = `/admin/${tenantCode}/login`;
    } else {
      window.location.href = '/login';
    }
  };

  const gradient = getAvatarGradient(user?.name);

  // Dynamic Breadcrumb Generator
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, index) => {
    const isLast = index === segments.length - 1;
    // Admin users on /manager/... paths should see "Admin" as the portal label
    const displaySeg = (seg === 'manager' && user?.role === 'ADMIN') ? 'admin' : seg;
    const label = breadcrumbLabels[displaySeg] || displaySeg.replace(/-/g, ' ');

    return (
      <span key={seg} className="flex items-center">
        {index > 0 && <span className="text-[var(--color-text-muted)] mx-1 text-xs">/</span>}
        {isLast ? (
          <span className="font-semibold text-[var(--color-text-primary)] text-xs truncate max-w-[120px] sm:max-w-none">{label}</span>
        ) : (
          <span className="text-[var(--color-text-secondary)] font-medium text-xs">{label}</span>
        )}
      </span>
    );
  });

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-[var(--color-header-bg)] border-b border-[var(--color-border)] shadow-sm transition-colors duration-250 ease-in-out">
      {/* Left — Menu Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Toggle mobile sidebar"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {crumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 overflow-hidden">{crumbs}</nav>
        ) : title ? (
          <h1 className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</h1>
        ) : null}
      </div>

      {/* Right — User Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Refresh Button */}
        <RefreshButton />

        {/* Notification Bell */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--color-border)] mx-1" />

        {/* User Card */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          {user?.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[var(--color-border)] shadow-sm"
            />
          ) : (
            <div className={cn(
              'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-[var(--color-border)]',
              gradient
            )}>
              {getInitials(user?.name)}
            </div>
          )}

          {/* Name & Role Badge */}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">{user?.name ?? 'User'}</p>
            {user?.role && (
              <span className={cn(
                'inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 uppercase tracking-wide leading-none',
                roleBadgeStyles[user.role] ?? 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
              )}>
                {roleLabels[user.role] ?? user.role}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-[var(--color-border)] mx-1" />

        {/* Mobile Theme Toggle */}
        <div className="sm:hidden flex items-center">
          <ThemeToggle />
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
