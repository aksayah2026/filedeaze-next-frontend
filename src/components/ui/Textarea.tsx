'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasCustomWidth = className && /\b(w-\d+|w-auto|w-px|w-fit|w-max|w-min|w-\[[^\]]+\]|max-w-|min-w-)/.test(className);
    return (
      <div className={cn("flex flex-col gap-1.5", !hasCustomWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[10px] border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] min-h-[80px] resize-y',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-all duration-200',
            'border-[var(--color-border-input)]',
            'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]',
            'hover:border-[var(--color-border-strong)]',
            'disabled:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-light)]',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
