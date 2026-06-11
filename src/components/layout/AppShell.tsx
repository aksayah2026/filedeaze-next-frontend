'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Topbar } from './Topbar';

interface AppShellProps {
  sidebar: (onClose: () => void) => React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static in flow on desktop */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out',
          'lg:static lg:inset-auto lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar(close)}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
