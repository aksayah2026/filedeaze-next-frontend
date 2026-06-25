'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[0_1px_3px_var(--color-primary-ring),0_0_0_1px_var(--color-primary-ring)] hover:shadow-[0_4px_14px_var(--color-primary-ring)] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none',
  secondary:
    'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] active:scale-[0.98] disabled:opacity-50',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
  success:
    'bg-[var(--color-success)] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
  ghost:
    'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] active:scale-[0.98] disabled:opacity-50',
  outline:
    'border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] active:scale-[0.98] disabled:opacity-50',
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
        'inline-flex items-center justify-center rounded-[8px] font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
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
