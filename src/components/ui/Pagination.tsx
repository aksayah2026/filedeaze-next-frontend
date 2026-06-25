'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    let p = i + 1;
    if (totalPages > 5) {
      if (page <= 3) p = i + 1;
      else if (page >= totalPages - 2) p = totalPages - 4 + i;
      else p = page - 2 + i;
    }
    return p;
  });

  return (
    <div className="flex items-center justify-between px-1 py-4 mt-1 select-none">
      <p className="text-xs text-[var(--color-text-muted)]">
        Showing{' '}
        <span className="font-semibold text-[var(--color-text-secondary)]">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-semibold text-[var(--color-text-secondary)]">{total}</span>
        {' '}results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-all',
            'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition-all',
              p === page
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary-ring)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]'
            )}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-all',
            'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
