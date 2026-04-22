/**
 * DataTable Component
 * Reusable data table with:
 * - Real-time search
 * - Column sorting
 * - Pagination with size selector
 * - Multi-selection with bulk actions
 * - CSV export
 *
 * Accessibility improvements:
 * - Proper table structure with scope attributes
 * - ARIA labels for interactive elements
 * - Keyboard navigation support
 * - Loading states announced to screen readers
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Loader2, Search } from 'lucide-react';
import { useAnnouncer } from '@/hooks/useAnnouncer';

// SortIcon component extracted outside DataTable to avoid nested function definition
interface SortIconProps {
  sortDirection: SortDirection;
}

function SortIcon({ sortDirection }: Readonly<SortIconProps>) {
  if (sortDirection === 'asc') {
    return <ChevronUp className="h-4 w-4" aria-hidden="true" />;
  }
  if (sortDirection === 'desc') {
    return <ChevronDown className="h-4 w-4" aria-hidden="true" />;
  }
  return null;
}

// BulkActionIcon component extracted to avoid nested function
interface BulkActionIconProps {
  isLoading: boolean;
  icon?: React.ReactNode;
}

function BulkActionIcon({ isLoading, icon }: Readonly<BulkActionIconProps>) {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
  }
  return icon;
}

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
  onBulkAction?: (actionKey: string, selectedIds: string[]) => void | Promise<void>;
  exportable?: boolean;
  exportFilename?: string;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRowClassName?: string;
  /** Accessible label for the table */
  tableLabel?: string;
}

export function DataTable<T extends object>(props: Readonly<DataTableProps<T>>) {
  const {
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
    tableLabel = 'Tabla de datos',
  } = props;

  const { announce } = useAnnouncer();
  const tableRef = useRef<HTMLTableElement>(null);

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
    const keysToSearch = searchKeys || columns.map(col => col.key);

    return data.filter(row => {
      return keysToSearch.some(key => {
        const value = row[key as keyof T];
        if (value === null || value === undefined) {
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

      if (aValue === null || aValue === undefined) {
        if (bValue === null || bValue === undefined) {
          return 0;
        }
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (bValue === null || bValue === undefined) {
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
    (columnKey: keyof T | string, columnHeader: string) => {
      let newDirection: SortDirection = 'asc';

      if (sortColumn === columnKey) {
        if (sortDirection === 'asc') {
          newDirection = 'desc';
        } else if (sortDirection === 'desc') {
          newDirection = null;
        } else {
          newDirection = 'asc';
        }

        if (sortDirection === 'desc' && newDirection === null) {
          setSortColumn(null);
          announce(`Ordenación eliminada para ${columnHeader}`, 'polite');
        } else {
          setSortDirection(newDirection);
          announce(
            `Ordenado por ${columnHeader} en orden ${newDirection === 'asc' ? 'ascendente' : 'descendente'}`,
            'polite',
          );
        }
      } else {
        setSortColumn(columnKey);
        setSortDirection('asc');
        announce(`Ordenado por ${columnHeader} en orden ascendente`, 'polite');
      }
    },
    [sortColumn, sortDirection, announce],
  );

  const toggleRowSelection = useCallback(
    (rowId: string, rowName?: string) => {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        const isSelected = newSet.has(rowId);
        if (isSelected) {
          newSet.delete(rowId);
          announce(`${rowName || 'Elemento'} deseleccionado`, 'polite');
        } else {
          newSet.add(rowId);
          announce(`${rowName || 'Elemento'} seleccionado`, 'polite');
        }
        return newSet;
      });
    },
    [announce],
  );

  const toggleAllSelection = useCallback(() => {
    setSelectedRows(prev => {
      if (prev.size === paginatedData.length) {
        announce('Todos los elementos deseleccionados', 'polite');
        return new Set();
      }
      const allIds = paginatedData.map(row => String(row[rowKey]));
      announce(`${allIds.length} elementos seleccionados`, 'polite');
      return new Set(allIds);
    });
  }, [paginatedData, rowKey, announce]);

  const getCellValue = useCallback((row: T, column: Column<T>): React.ReactNode => {
    const value = row[column.key as keyof T];
    if (column.render) {
      return column.render(value as unknown, row);
    }
    return value !== null && value !== undefined ? String(value) : null;
  }, []);

  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    announce('Exportando datos a CSV...', 'polite');

    try {
      const headers = columns.map(col => col.header).join(',');
      const rows = filteredData.map(row =>
        columns
          .map(col => {
            const value = row[col.key as keyof T];
            if (value === null || value === undefined) {
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
      announce('Exportación completada', 'polite');
    } finally {
      setIsExporting(false);
    }
  }, [columns, filteredData, exportFilename, announce]);

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      setBulkActionLoading(action.key);
      announce(`Ejecutando acción: ${action.label}...`, 'polite');

      try {
        const selectedIds = Array.from(selectedRows);
        if (onBulkAction) {
          await onBulkAction(action.key, selectedIds);
        } else {
          await action.onClick(selectedIds);
        }
        setSelectedRows(new Set());
        announce(`Acción ${action.label} completada`, 'polite');
      } finally {
        setBulkActionLoading(null);
      }
    },
    [selectedRows, onBulkAction, announce],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value) {
        announce(`Buscando: ${value}`, 'polite');
      }
    },
    [announce],
  );

  // Calculate selection state for "select all" checkbox
  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(String(row[rowKey])));
  const someSelected = selectedRows.size > 0 && !allSelected;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label={searchPlaceholder}
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
                aria-label="Exportar a CSV"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectable && selectedRows.size > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-lg" role="status" aria-live="polite">
            <span className="text-sm font-medium text-indigo-900">
              {selectedRows.size} {selectedRows.size === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
            <div className="flex gap-2">
              {bulkActions.map(action => {
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
                    aria-label={action.label}
                  >
                    <BulkActionIcon isLoading={bulkActionLoading === action.key} icon={action.icon} />
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
              <div className="p-12 text-center" role="status" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-500">Cargando datos...</p>
              </div>
            );
          }
          if (paginatedData.length === 0) {
            const emptyText = searchQuery ? noResultsMessage : emptyMessage;
            return (
              <div className="p-12 text-center text-gray-500" role="status">
                {emptyText}
              </div>
            );
          }
          return (
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200" aria-label={tableLabel}>
              <thead className="bg-gray-50">
                <tr>
                  {selectable && (
                    <th scope="col" className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) {
                            input.indeterminate = someSelected;
                          }
                        }}
                        onChange={toggleAllSelection}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        aria-label={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      />
                    </th>
                  )}
                  {columns.map(column => (
                    <th
                      key={String(column.key)}
                      scope="col"
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      } ${column.className || ''}`}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key, column.header)}
                      aria-sort={
                        sortColumn === column.key
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : sortDirection === 'desc'
                              ? 'descending'
                              : 'none'
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {column.sortable && sortColumn === column.key && <SortIcon sortDirection={sortDirection} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map(row => {
                  const rowId = String(row[rowKey]);
                  const isSelected = selectedRows.has(rowId);
                  const rowName =
                    'name' in row
                      ? String(row.name)
                      : 'nombre' in row
                        ? String(row.nombre)
                        : 'title' in row
                          ? String(row.title)
                          : 'Elemento';

                  return (
                    <tr
                      key={rowId}
                      className={`hover:bg-gray-50 ${
                        isSelected ? selectedRowClassName : ''
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(row)}
                      aria-selected={selectable ? isSelected : undefined}
                    >
                      {selectable && (
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(rowId, rowName)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            aria-label={`Seleccionar ${rowName}`}
                          />
                        </td>
                      )}
                      {columns.map(column => (
                        <td
                          key={String(column.key)}
                          className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 ${
                            column.width ? '' : 'whitespace-normal break-words'
                          } ${column.className || ''}`}
                          style={{ width: column.width, minWidth: column.width }}
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
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de{' '}
                {sortedData.length} resultados
              </span>
              <label className="sr-only" htmlFor="page-size-select">
                Resultados por página
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  announce(`${e.target.value} resultados por página`, 'polite');
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size} / pág
                  </option>
                ))}
              </select>
            </div>

            <nav aria-label="Paginación" className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  announce('Página anterior', 'polite');
                }}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
              <span className="text-xs sm:text-sm text-gray-700 px-1 sm:px-2 whitespace-nowrap">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  announce('Página siguiente', 'polite');
                }}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
