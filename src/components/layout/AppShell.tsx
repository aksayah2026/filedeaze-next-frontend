'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Topbar } from './Topbar';

interface AppShellProps {
  sidebar: (onClose: () => void, isCollapsed: boolean) => React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [open, setOpen] = useState(false); // Mobile drawer open
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapsed
  const close = () => setOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={close}
        />
      )}

      {/* Sidebar — drawer on mobile, static collapsible on desktop */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out h-full border-r border-slate-200 lg:border-none',
          'lg:static lg:inset-auto lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {sidebar(close, isCollapsed)}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar 
          onMenuClick={() => setOpen(v => !v)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(v => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fe-fade-in bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
