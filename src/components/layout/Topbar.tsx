'use client';

import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface TopbarProps { title?: string; onMenuClick?: () => void; }

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, clearAuth, role } = useAuth();
  const router = useRouter();

  const logout = async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken: rt });
    } catch {}
    clearAuth();
    if (role === 'SUPER_ADMIN') router.push('/super-admin/login');
    else if (role === 'ADMIN') router.push('/admin/login');
    else router.push('/manager/login');
    toast.success('Logged out');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            {user?.photo
              ? <img src={user.photo} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
              : <User size={16} className="text-blue-600" />
            }
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
