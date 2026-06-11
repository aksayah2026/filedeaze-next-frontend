'use client';

import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  SortingState, useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { PageSpinner } from './Spinner';
import { EmptyState } from './EmptyState';

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
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h.isPlaceholder ? null : (
                    <div
                      className={h.column.getCanSort() ? 'flex items-center gap-1 cursor-pointer select-none' : ''}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span className="text-gray-300">
                          {h.column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
                           h.column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
                           <ChevronsUpDown size={12} />}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {table.getRowModel().rows.length === 0 ? (
            <tr><td colSpan={columns.length}><EmptyState /></td></tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
