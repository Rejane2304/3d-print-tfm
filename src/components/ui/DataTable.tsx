/**
 * DataTable Component
 * Reusable data table with:
 * - Real-time search
 * - Column sorting
 * - Pagination with size selector
 * - Multi-selection with bulk actions
 * - CSV export
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  Search,
} from 'lucide-react';

// Types
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary';
  onClick: (selectedIds: string[]) => void | Promise<void>;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  onBulkAction?: (
    actionKey: string,
    selectedIds: string[],
  ) => void | Promise<void>;
  exportable?: boolean;
  exportFilename?: string;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRowClassName?: string;
}

export function DataTable<T extends object>(props: Readonly<DataTableProps<T>>) {
  const {
    data,
    columns,
    rowKey,
    searchable = false,
    searchKeys,
    searchPlaceholder = 'Search...',
    pagination = true,
    pageSizeOptions = [10, 25, 50, 100],
    defaultPageSize = 25,
    selectable = false,
    bulkActions = [],
    onBulkAction,
    exportable = false,
    exportFilename = 'export.csv',
    loading = false,
    emptyMessage = 'No data available',
    noResultsMessage = 'No results found',
    className = '',
    onRowClick,
    selectedRowClassName = 'bg-indigo-50',
  } = props;

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase().trim();
    const keysToSearch = searchKeys || columns.map((col) => col.key);

    return data.filter((row) => {
      return keysToSearch.some((key) => {
        const value = row[key as keyof T];
        if (value == null) {
          return false;
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchable, searchKeys, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue == null && bValue == null) {
        return 0;
      }
      if (aValue == null) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (bValue == null) {
        return sortDirection === 'asc' ? 1 : -1;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!pagination) {
      return sortedData;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Handlers
  const handleSort = useCallback(
    (columnKey: keyof T | string) => {
      if (sortColumn === columnKey) {
        setSortDirection((prev) => {
          if (prev === 'asc') {
            return 'desc';
          }
          if (prev === 'desc') {
            return null;
          }
          return 'asc';
        });
        if (sortDirection === 'desc') {
          setSortColumn(null);
        }
      } else {
        setSortColumn(columnKey);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection],
  );

  const toggleRowSelection = useCallback((rowId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      const isSelected = newSet.has(rowId);
      if (isSelected) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === paginatedData.length) {
        return new Set();
      }
      return new Set(paginatedData.map((row) => String(row[rowKey])));
    });
  }, [paginatedData, rowKey]);

  const getCellValue = useCallback(
    (row: T, column: Column<T>): React.ReactNode => {
      const value = row[column.key as keyof T];
      if (column.render) {
        return column.render(value as unknown, row);
      }
      return value !== null && value !== undefined ? String(value) : null;
    },
    [],
  );

  const exportToCSV = useCallback(async() => {
    setIsExporting(true);
    try {
      const headers = columns.map((col) => col.header).join(',');
      const rows = filteredData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key as keyof T];
            if (value == null) {
              return '';
            }
            // Escape quotes and wrap in quotes if contains comma
            const str = String(value).replaceAll('"', '""');
            if (str.includes(',') || str.includes('"')) {
              return `"${str}"`;
            }
            return str;
          })
          .join(','),
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [columns, filteredData, exportFilename]);

  const handleBulkAction = useCallback(
    async(action: BulkAction) => {
      setBulkActionLoading(action.key);
      try {
        const selectedIds = Array.from(selectedRows);
        if (onBulkAction) {
          await onBulkAction(action.key, selectedIds);
        } else {
          await action.onClick(selectedIds);
        }
        setSelectedRows(new Set());
      } finally {
        setBulkActionLoading(null);
      }
    },
    [selectedRows, onBulkAction],
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {exportable && (
              <button
                onClick={exportToCSV}
                disabled={isExporting || filteredData.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectable && selectedRows.size > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
            <span className="text-sm font-medium text-indigo-900">
              {selectedRows.size} selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action) => {
                let variantClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                if (action.variant === 'danger') {
                  variantClass = 'bg-red-100 text-red-700 hover:bg-red-200';
                } else if (action.variant === 'primary') {
                  variantClass = 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
                }
                return (
                  <button
                    key={action.key}
                    onClick={() => handleBulkAction(action)}
                    disabled={bulkActionLoading === action.key}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${variantClass} disabled:opacity-50`}
                  >
                    {(() => {
                      const isLoading = bulkActionLoading === action.key;
                      if (isLoading) {
                        return <Loader2 className="h-4 w-4 animate-spin" />;
                      }
                      return action.icon;
                    })()}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {(() => {
          if (loading) {
            return (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            );
          }
          if (paginatedData.length === 0) {
            return (
              <div className="p-12 text-center text-gray-500">
                {searchQuery ? noResultsMessage : emptyMessage}
              </div>
            );
          }
          return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((row) =>
                          selectedRows.has(String(row[rowKey])),
                        )
                      }
                      onChange={toggleAllSelection}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${column.className || ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {(() => {
                         const isSorted = column.sortable && sortColumn === column.key;
                         if (!isSorted) return null;
                         if (sortDirection === 'asc') {
                           return <ChevronUp className="h-4 w-4" />;
                         }
                         if (sortDirection === 'desc') {
                           return <ChevronDown className="h-4 w-4" />;
                         }
                         return null;
                       })()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row) => {
                const rowId = String(row[rowKey]);
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr
                    key={rowId}
                    className={`hover:bg-gray-50 ${
                      isSelected ? selectedRowClassName : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowId)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-3 text-sm text-gray-900 ${
                          column.width ? '' : 'whitespace-nowrap'
                        } ${column.className || ''}`}
                        style={{ width: column.width }}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          );
        })()}
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="p-2 sm:p-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="text-gray-700 whitespace-nowrap">
                Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} de{' '}
                {sortedData.length} resultados
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / pág
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-xs sm:text-sm text-gray-700 px-1 sm:px-2 whitespace-nowrap">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
