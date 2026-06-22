'use client';

import { LogOut, Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  SUPER_ADMIN: 'bg-blue-50 text-blue-700 border-blue-100',
  ADMIN: 'bg-teal-50 text-teal-700 border-teal-100',
  MANAGER: 'bg-green-50 text-green-700 border-green-100',
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
    try {
      const rt = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken: rt });
    } catch {}
    clearAuth();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const gradient = getAvatarGradient(user?.name);

  // Dynamic Breadcrumb Generator
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, index) => {
    const isId = seg.length > 20 || /^[a-f0-9-]+$/i.test(seg);
    const label = isId ? 'Details' : (breadcrumbLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1));
    const url = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    return (
      <span key={url} className="flex items-center gap-1.5">
        {index > 0 && <span className="text-slate-300 text-[10px] font-bold">/</span>}
        {isLast ? (
          <span className="font-semibold text-slate-700 text-xs truncate max-w-[120px] sm:max-w-none">{label}</span>
        ) : (
          <span className="text-slate-400 font-medium text-xs">{label}</span>
        )}
      </span>
    );
  });

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left — Menu Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Toggle mobile sidebar"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {crumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 overflow-hidden">{crumbs}</nav>
        ) : title ? (
          <h1 className="text-xs font-semibold text-slate-800">{title}</h1>
        ) : null}
      </div>

      {/* Right — User Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification Bell */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-100 mx-1" />

        {/* User Card */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          {user?.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
            />
          ) : (
            <div className={cn(
              'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-slate-100',
              gradient
            )}>
              {getInitials(user?.name)}
            </div>
          )}

          {/* Name & Role Badge */}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name ?? 'User'}</p>
            {user?.role && (
              <span className={cn(
                'inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 uppercase tracking-wide leading-none',
                roleBadgeStyles[user.role] ?? 'bg-slate-50 text-slate-600 border-slate-150'
              )}>
                {roleLabels[user.role] ?? user.role}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-100 mx-1" />

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
