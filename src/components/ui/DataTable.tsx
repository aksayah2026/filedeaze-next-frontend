'use client';

import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  SortingState, useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { PageSpinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto table-sticky-head">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surface-elevated)]/80">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap"
                  >
                    {h.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          h.column.getCanSort() ? 'cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors' : ''
                        )}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() && (
                          <span className={cn(
                            'transition-colors',
                            h.column.getIsSorted() ? 'text-[var(--color-primary)]' : 'text-[var(--color-border-strong)]'
                          )}>
                            {h.column.getIsSorted() === 'asc' ? (
                              <ChevronUp size={12} />
                            ) : h.column.getIsSorted() === 'desc' ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronsUpDown size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'group transition-colors duration-100',
                    idx % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-elevated)]/40',
                    'hover:bg-[var(--color-primary-light)]/40'
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
