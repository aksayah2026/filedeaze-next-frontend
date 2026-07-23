'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  /** When provided, renders a rows-per-page selector next to the record count. */
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange, pageSizeOptions = DEFAULT_PAGE_SIZES }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-4 mt-1 select-none">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          Showing{' '}
          <span className="font-semibold text-[var(--color-text-secondary)]">{from}–{to}</span>
          {' '}of{' '}
          <span className="font-semibold text-[var(--color-text-secondary)]">{total}</span>
          {' '}results
        </p>
        {onLimitChange && (
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-md border border-[var(--color-border-input)] bg-[var(--color-input-bg)] px-1.5 py-1 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        )}
      </div>

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
