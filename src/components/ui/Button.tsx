'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-[var(--color-primary)] text-white shadow-[0_1px_3px_var(--color-primary-ring)] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_4px_12px_var(--color-primary-ring)] active:scale-[0.98] active:shadow-[0_1px_2px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:shadow-none',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-[0.98] active:bg-slate-200 disabled:opacity-50',
  danger:
    'bg-[#EF4444] text-white shadow-[0_1px_3px_rgba(239,68,68,0.25)] hover:bg-red-650 hover:shadow-[0_4px_10px_rgba(239,68,68,0.3)] active:scale-[0.98] disabled:bg-red-300 disabled:shadow-none',
  success:
    'bg-[var(--color-success)] text-white shadow-[0_1px_3px_rgba(34,197,94,0.25)] hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] active:bg-slate-200 disabled:opacity-50',
  outline:
    'border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-350 active:scale-[0.98] disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 h-7',
  md: 'px-4 py-2 text-sm gap-2 h-9',
  lg: 'px-5 py-2.5 text-sm gap-2 h-10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        'cursor-pointer disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={13} className="animate-spin shrink-0" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
