'use client';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  // Server-side pagination props
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
}

export default function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'بحث...',
  pagination,
  onPageChange,
  onSearch,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const isServerSide = !!pagination && !!onPageChange;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: isServerSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
    pageCount: isServerSide ? Math.ceil(pagination.total / pagination.limit) : undefined,
  });

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePreviousPage = () => {
    if (isServerSide && pagination) {
      onPageChange(pagination.page - 1);
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (isServerSide && pagination) {
      onPageChange(pagination.page + 1);
    } else {
      table.nextPage();
    }
  };

  const canPreviousPage = isServerSide
    ? pagination.page > 1
    : table.getCanPreviousPage();

  const canNextPage = isServerSide
    ? pagination.hasMore
    : table.getCanNextPage();

  const currentPage = isServerSide
    ? pagination.page
    : table.getState().pagination.pageIndex + 1;

  const totalPages = isServerSide
    ? Math.ceil(pagination.total / pagination.limit)
    : table.getPageCount();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-slate-200">
        <div className="relative">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-right text-sm font-medium text-slate-600"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-slate-700">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {isServerSide ? (
            <>
              صفحة {currentPage} من {totalPages} ({pagination.total.toLocaleString('ar-EG')} نتيجة)
            </>
          ) : (
            <>
              صفحة {currentPage} من {totalPages}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={handleNextPage}
            disabled={!canNextPage}
            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
