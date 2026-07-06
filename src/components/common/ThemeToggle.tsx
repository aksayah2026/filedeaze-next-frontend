'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("w-14 h-8 rounded-full", className)} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative flex items-center w-14 h-8 rounded-full p-1 transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:scale-95",
        isDark 
          ? "bg-[#1F2330] border border-[rgba(255,255,255,0.08)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] hover:border-[rgba(255,255,255,0.15)] hover:shadow-[0_0_12px_rgba(79,139,255,0.15)]" 
          : "bg-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] hover:border-slate-400 hover:shadow-[0_0_12px_rgba(37,99,235,0.15)]",
        className
      )}
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div 
        className={cn(
          "absolute flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-surface)] shadow-md transform transition-all duration-150 ease-in-out group-hover:scale-105",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        <Sun 
          size={14} 
          className={cn(
            "absolute text-amber-500 transition-all duration-120 ease-in-out",
            isDark ? "opacity-0 rotate-[135deg] scale-50" : "opacity-100 rotate-0 scale-100"
          )} 
        />
        <Moon 
          size={14} 
          className={cn(
            "absolute text-[var(--color-primary)] transition-all duration-120 ease-in-out",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-[135deg] scale-50"
          )} 
        />
      </div>
    </button>
  );
}
