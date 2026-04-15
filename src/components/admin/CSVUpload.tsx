/**
 * CSV Upload Component
 * Reusable component for importing data from CSV files
 * Supports preview, validation, and error reporting
 */
'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2, Download } from 'lucide-react';

interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface CSVUploadProps {
  title: string;
  description: string;
  requiredColumns: string[];
  optionalColumns?: string[];
  apiEndpoint: string;
  sampleCSV: string;
  onSuccess?: () => void;
  options?: {
    skipDuplicates?: boolean;
    createMissingUsers?: boolean;
  };
}

interface PreviewData {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

export function CSVUpload({
  title,
  description,
  requiredColumns,
  optionalColumns = [],
  apiEndpoint,
  sampleCSV,
  onSuccess,
  options = {},
}: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(options.skipDuplicates ?? false);
  const [createMissingUsers, setCreateMissingUsers] = useState(options.createMissingUsers ?? false);

  const parseCSV = useCallback((content: string): CSVRow[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse headers (handle quoted values)
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      rows.push(row);
    }

    return rows;
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        setError('El archivo debe ser un CSV');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const data = parseCSV(content);

          if (data.length === 0) {
            setError('El archivo CSV está vacío o tiene formato incorrecto');
            return;
          }

          const headers = Object.keys(data[0]);
          // Validar columnas inline
          const headerSet = new Set(headers.map(h => h.toLowerCase()));
          const missing = requiredColumns.filter(col => !headerSet.has(col.toLowerCase()));
          const validation = { valid: missing.length === 0, missing };

          if (!validation.valid) {
            setError(`Columnas requeridas faltantes: ${validation.missing.join(', ')}`);
            return;
          }

          setPreview({
            headers,
            rows: data.slice(0, 10), // Preview first 10 rows
            totalRows: data.length,
          });
          setParsedData(data);
          setError(null);
          setResult(null);
        } catch {
          setError('Error al parsear el archivo CSV');
        }
      };
      reader.readAsText(file);
    },
    [parseCSV, requiredColumns],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const importOptions: Record<string, boolean> = {};
      if (skipDuplicates) importOptions.skipDuplicates = true;
      if (createMissingUsers) importOptions.createMissingUsers = true;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData,
          options: importOptions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al importar');
        return;
      }

      setResult(data);

      if (data.success && data.imported > 0 && onSuccess) {
        onSuccess();
      }
    } catch {
      setError('Error de conexión al importar');
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setParsedData([]);
    setResult(null);
    setError(null);
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <button
          onClick={downloadSample}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <Download className="h-4 w-4" />
          Descargar ejemplo
        </button>
      </div>

      {/* Required columns */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-2">Columnas requeridas:</p>
        <div className="flex flex-wrap gap-1.5">
          {requiredColumns.map(col => (
            <span key={col} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
              {col}
            </span>
          ))}
        </div>
        {optionalColumns.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Columnas opcionales:</p>
            <div className="flex flex-wrap gap-1.5">
              {optionalColumns.map(col => (
                <span key={col} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                  {col}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        {options.skipDuplicates !== undefined && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={e => setSkipDuplicates(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Omitir duplicados</span>
          </label>
        )}
        {options.createMissingUsers !== undefined && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createMissingUsers}
              onChange={e => setCreateMissingUsers(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Crear usuarios si no existen</span>
          </label>
        )}
      </div>

      {/* Upload area */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            Arrastra un archivo CSV aquí o{' '}
            <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
              selecciona uno
              <input type="file" accept=".csv" onChange={handleFileInput} className="sr-only" />
            </label>
          </p>
          <p className="text-xs text-gray-500">Solo archivos .csv</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Vista previa</span>
              <span className="text-sm text-gray-500">
                ({preview.totalRows} filas totales, mostrando {preview.rows.length})
              </span>
            </div>
            <button onClick={handleClear} className="text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                      {requiredColumns.includes(header) && <span className="text-red-500 ml-0.5">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((header, j) => (
                      <td
                        key={j}
                        className="px-4 py-2 text-sm text-gray-900 truncate max-w-xs"
                        title={String(row[header])}
                      >
                        {String(row[header] ?? '').substring(0, 50)}
                        {String(row[header] ?? '').length > 50 ? '...' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.totalRows > 10 && (
            <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
              ... y {preview.totalRows - 10} filas más
            </div>
          )}

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar {preview.totalRows} filas
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-yellow-800'}`}>{result.message}</p>
              <p className="text-sm text-gray-600 mt-1">
                {result.imported} importados • {result.errors.length} errores • {result.warnings.length} advertencias
              </p>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-700 mb-2">Errores:</p>
                  <div className="bg-white rounded border border-red-200 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="px-3 py-2 text-sm text-red-600 border-b border-red-100 last:border-0">
                        Fila {err.row}: {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-700 mb-2">Advertencias:</p>
                  <div className="bg-white rounded border border-yellow-200 max-h-32 overflow-y-auto">
                    {result.warnings.map((warn, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 text-sm text-yellow-600 border-b border-yellow-100 last:border-0"
                      >
                        Fila {warn.row}: {warn.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleClear} className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}

export default CSVUpload;
