'use client';

import { LogOut, User, Menu, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TopbarProps { title?: string; onMenuClick?: () => void; }

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
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

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, clearAuth } = useAuth();
  const router = useRouter();

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

  return (
    <header className="glass sticky top-0 z-10 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left — Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
        )}
      </div>

      {/* Right — User area */}
      <div className="flex items-center gap-2">
        {/* Notification bell (visual only) */}
        <button className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors relative">
          <Bell size={16} />
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          {user?.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className={cn(
              'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white',
              gradient
            )}>
              {getInitials(user?.name)}
            </div>
          )}

          {/* Name + role */}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {roleLabels[user?.role ?? ''] ?? user?.role}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
