'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';

    const hasCustomWidth =
      className &&
      /\b(w-\d+|w-auto|w-px|w-fit|w-max|w-min|w-\[[^\]]+\]|max-w-|min-w-)/.test(
        className
      );

    return (
      <div className={cn('flex flex-col gap-1.5', !hasCustomWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide select-none"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'w-full rounded-[10px] border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'transition-all duration-200',
              'border-[var(--color-border-input)]',
              'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]',
              'hover:border-[var(--color-border-strong)]',
              'disabled:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
              isPassword && 'pr-10',
              error &&
                'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-light)]',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-danger)] font-medium">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-danger)]" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';