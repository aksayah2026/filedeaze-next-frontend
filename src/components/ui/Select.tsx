'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasCustomWidth = className && /\b(w-\d+|w-auto|w-px|w-fit|w-max|w-min|w-\[[^\]]+\]|max-w-|min-w-)/.test(className);
    return (
      <div className={cn("flex flex-col gap-1.5", !hasCustomWidth && "w-full")}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-[10px] border bg-[var(--color-input-bg)] px-3 py-2 pr-8 text-sm text-[var(--color-text-primary)]',
              'transition-all duration-200 cursor-pointer',
              'border-[var(--color-border-input)]',
              'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]',
              'hover:border-[var(--color-border-strong)]',
              'disabled:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
              error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-light)]',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--color-text-muted)]">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-danger)] font-medium">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-danger)]" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
