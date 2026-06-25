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
    return <div className="w-8 h-8" />; // Placeholder to prevent hydration mismatch
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
        theme === 'light' 
          ? "bg-[var(--color-surface-elevated)] hover:bg-slate-200 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" 
          : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white",
        className
      )}
      aria-label="Toggle Theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
