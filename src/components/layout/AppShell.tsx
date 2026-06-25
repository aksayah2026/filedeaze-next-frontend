'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Topbar } from './Topbar';
import { useIsFetching } from '@tanstack/react-query';

interface AppShellProps {
  sidebar: (onClose: () => void, isCollapsed: boolean) => React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [open, setOpen] = useState(false); // Mobile drawer open
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapsed
  const close = () => setOpen(false);

  const isFetching = useIsFetching();
  const [showFlash, setShowFlash] = useState(false);
  const [prevFetching, setPrevFetching] = useState(false);

  useEffect(() => {
    if (isFetching > 0) {
      setPrevFetching(true);
    } else if (isFetching === 0 && prevFetching) {
      // Trigger a visual pulse confirmation when data finishes refetching
      setShowFlash(true);
      setPrevFetching(false);
      const timer = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFetching, prevFetching]);

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
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
          'lg:my-4 lg:ml-4 lg:h-[calc(100vh_-_2rem)] lg:rounded-[24px] lg:overflow-hidden lg:shadow-[0_4px_20px_rgba(0,0,0,0.06)] lg:self-center'
        )}
      >
        {sidebar(close, isCollapsed)}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">
        {/* Glowing thin loading progress line at the top border of the panel */}
        <div
          className={cn(
            "absolute top-[64px] left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 z-20 transition-all duration-300 origin-left scale-x-0",
            isFetching > 0 && "scale-x-100 animate-[pulse_1.5s_infinite]"
          )}
        />
        <Topbar
          onMenuClick={() => setOpen(v => !v)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(v => !v)}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] transition-all duration-300",
            isFetching > 0 ? "opacity-75 saturate-[0.85] pointer-events-none" : "opacity-100 saturate-100",
            showFlash ? "animate-[pulse_0.4s_ease-in-out_1]" : "animate-fe-fade-in"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
