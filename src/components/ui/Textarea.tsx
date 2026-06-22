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
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={areaId}
            className="text-xs font-semibold text-slate-650 uppercase tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={3}
          className={cn(
            'w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'transition-all duration-150',
            'border-[#E2E8F0]',
            'focus:border-[var(--color-primary)] focus:outline-none focus:ring-3 focus:ring-[var(--color-primary-ring)]',
            'hover:border-slate-300',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400',
            error && 'border-red-400 focus:border-red-400 focus:ring-[rgba(239,68,68,0.12)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
