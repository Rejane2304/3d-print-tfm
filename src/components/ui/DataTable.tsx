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

import React, { useState, useMemo, useCallback, useId } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  Trash2,
} from 'lucide-react';

// Types
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  /**
   * Responsive breakpoints to hide column
   * e.g., 'hidden sm:table-cell' shows on sm and up
   * 'hidden lg:table-cell' shows on lg and up
   */
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
  onBulkAction?: (actionKey: string, selectedIds: string[]) => void | Promise<void>;
  exportable?: boolean;
  exportFilename?: string;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRowClassName?: string;
}

export function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  searchable = false,
  searchKeys,
  searchPlaceholder = 'Buscar...',
  pagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  selectable = false,
  bulkActions = [],
  onBulkAction,
  exportable = false,
  exportFilename = 'export.csv',
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  noResultsMessage = 'No se encontraron resultados',
  className = '',
  onRowClick,
  selectedRowClassName = 'bg-indigo-50',
}: DataTableProps<T>) {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  const uniqueId = useId();

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();
    const keysToSearch = searchKeys || columns.map((col) => col.key);

    return data.filter((row) => {
      return keysToSearch.some((key) => {
        const value = row[key as keyof T];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchable, searchKeys, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Handlers
  const handleSort = useCallback((columnKey: keyof T | string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const toggleRowSelection = useCallback((rowId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
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
      return new Set(paginatedData.map((row) => String(row[rowKey as keyof T])));
    });
  }, [paginatedData, rowKey]);

  const handleBulkAction = useCallback(async (action: BulkAction) => {
    if (selectedRows.size === 0) return;
    
    setBulkActionLoading(action.key);
    try {
      await action.onClick(Array.from(selectedRows));
      if (onBulkAction) {
        await onBulkAction(action.key, Array.from(selectedRows));
      }
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedRows, onBulkAction]);

  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const headers = columns.map((col) => col.header).join(',');
      const rows = filteredData.map((row) => {
        return columns
          .map((col) => {
            const value = row[col.key as keyof T];
            const cellValue = value == null ? '' : String(value);
            // Escape quotes and wrap in quotes if contains comma
            if (cellValue.includes(',') || cellValue.includes('"')) {
              return `"${cellValue.replace(/"/g, '""')}"`;
            }
            return cellValue;
          })
          .join(',');
      });
      
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [filteredData, columns, exportFilename]);

  const getCellValue = (row: T, column: Column<T>) => {
    const value = row[column.key as keyof T];
    if (column.render) {
      return column.render(value, row);
    }
    return value == null ? '-' : String(value);
  };

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
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectable && selectedRows.size > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
            <span className="text-sm font-medium text-indigo-900">
              {selectedRows.size} seleccionados
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleBulkAction(action)}
                  disabled={bulkActionLoading === action.key}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    action.variant === 'danger'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : action.variant === 'primary'
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {bulkActionLoading === action.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    action.icon
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? noResultsMessage : emptyMessage}
          </div>
        ) : (
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
                          selectedRows.has(String(row[rowKey as keyof T]))
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
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : sortDirection === 'desc' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : null
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => {
                const rowId = String(row[rowKey as keyof T]);
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
        )}
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * pageSize) + 1} a{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} de{' '}
                {sortedData.length} resultados
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
