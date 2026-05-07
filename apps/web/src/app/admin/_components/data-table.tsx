'use client';

import { Skeleton } from '@ecommerce/ui';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SearchX } from 'lucide-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (index: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pageCount = 1,
  pageIndex = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="space-y-3">
      <div className="admin-card overflow-hidden transition-shadow hover:shadow-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="border-b border-brand-ink/[0.06]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-brand-ivory/30">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-6 py-3.5 text-left admin-label">
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-brand-ink/[0.04]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton className="h-4 w-full rounded-lg opacity-[0.15]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-brand-ink/20">
                      <SearchX size={36} strokeWidth={1.5} />
                      <p className="text-sm font-medium text-brand-ink/30">
                        Aucun résultat trouvé.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-brand-gold/[0.04] transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-brand-ink/[0.06] bg-brand-ivory/20">
          <div className="flex items-center gap-1.5 text-xs text-brand-ink/40">
            <span className="font-bold text-brand-ink tabular-nums">{total}</span>
            <span>résultats</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <p className="text-xs text-brand-ink/40 font-medium">Lignes</p>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="h-8 w-16 rounded-lg border border-brand-ink/[0.08] bg-white text-xs font-bold text-brand-ink focus:border-brand-gold focus:ring-0 outline-none px-2"
              >
                {[10, 20, 30, 40, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-brand-ink/40 tabular-nums">
              {pageIndex} / {pageCount}
            </div>

            <div className="flex items-center gap-1">
              {[
                { icon: ChevronsLeft, onClick: () => onPageChange?.(1), disabled: pageIndex === 1 },
                {
                  icon: ChevronLeft,
                  onClick: () => onPageChange?.(pageIndex - 1),
                  disabled: pageIndex === 1,
                },
                {
                  icon: ChevronRight,
                  onClick: () => onPageChange?.(pageIndex + 1),
                  disabled: pageIndex === pageCount,
                },
                {
                  icon: ChevronsRight,
                  onClick: () => onPageChange?.(pageCount),
                  disabled: pageIndex === pageCount,
                },
              ].map(({ icon: Icon, onClick, disabled }, idx) => (
                <button
                  key={idx}
                  onClick={onClick}
                  disabled={disabled || isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-ink/[0.08] bg-white text-brand-ink/40 hover:bg-brand-gold hover:text-brand-ivory hover:border-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
