/**
 * CSVUpload Component
 * Componente reutilizable para importación de archivos CSV
 * - Drag & drop de archivo CSV
 * - Preview de primeros 10 registros
 * - Validación de columnas requeridas
 * - Botón "Importar" / "Cancelar"
 * - Reporte de errores post-import
 */
'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface CSVPreviewRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
  productInfo?: { name: string; currentStock: number };
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
}

interface CSVUploadProps {
  title: string;
  description?: string;
  requiredColumns: string[];
  apiEndpoint: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  acceptedFileName?: string;
  sampleFileName?: string;
}

export function CSVUpload({
  title,
  description,
  requiredColumns,
  apiEndpoint,
  onSuccess,
  onCancel,
  acceptedFileName = 'archivo.csv',
  sampleFileName,
}: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<CSVPreviewRow[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    headers: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError('El archivo debe tener extensión .csv');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5MB');
      return false;
    }
    return true;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setFile(file);
      setError(null);
      setLoading(true);
      setPreviewData(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'preview');

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al procesar el archivo');
        }

        setStats({
          totalRows: data.totalRows,
          validRows: data.validRows,
          invalidRows: data.invalidRows,
          headers: data.headers,
        });
        setPreviewData(data.preview);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'import');

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setImportResult(data.result);
      if (data.result.imported > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setStats(null);
    setError(null);
    setExpandedErrors(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleErrorExpansion = (rowIndex: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedErrors(newExpanded);
  };

  const downloadSample = () => {
    if (!sampleFileName) return;
    const link = document.createElement('a');
    link.href = `/samples/${sampleFileName}`;
    link.download = sampleFileName;
    link.click();
  };

  // Si hay resultado de importación, mostrar resumen
  if (importResult) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Importación Completada!</h3>
          <p className="text-gray-600">Resumen de la importación</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
            <p className="text-sm text-green-700">Importados</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{importResult.skipped}</p>
            <p className="text-sm text-yellow-700">Omitidos</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{importResult.errors}</p>
            <p className="text-sm text-red-700">Errores</p>
          </div>
        </div>

        {importResult.errorDetails && importResult.errorDetails.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Detalles de errores:</h4>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {importResult.errorDetails.map((error, idx) => (
                <div key={idx} className="p-3 border-b border-gray-200 last:border-0 bg-red-50">
                  <p className="text-sm font-medium text-gray-900">Fila {error.row}</p>
                  <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                    {error.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Importar Otro Archivo
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Drop zone */}
      {!file && (
        <div>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Arrastra y suelta tu archivo CSV aquí</p>
            <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400">Máximo 5MB • Formato: {acceptedFileName}</p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleChange} className="hidden" />
          </div>

          {/* Required columns */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Columnas requeridas:</h4>
            <div className="flex flex-wrap gap-2">
              {requiredColumns.map(col => (
                <span key={col} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Sample download */}
          {sampleFileName && (
            <button
              onClick={downloadSample}
              className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Download className="h-4 w-4" />
              Descargar archivo de ejemplo
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Procesando archivo...</p>
        </div>
      )}

      {/* Preview */}
      {previewData && stats && !loading && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{stats.totalRows}</p>
              <p className="text-xs text-gray-500">Total filas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.validRows}</p>
              <p className="text-xs text-green-700">Válidas</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.invalidRows}</p>
              <p className="text-xs text-red-700">Con errores</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Vista previa (primeros {previewData.length} registros):
            </h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                    {stats.headers.map(header => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map(row => (
                    <tr key={row.row} className={row.valid ? '' : 'bg-red-50'}>
                      <td className="px-3 py-2 text-sm text-gray-500">{row.row}</td>
                      {stats.headers.map(header => (
                        <td key={header} className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {row.data[header] || '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <button
                            onClick={() => toggleErrorExpansion(row.row)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800"
                          >
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-xs">{row.errors.length}</span>
                            {expandedErrors.has(row.row) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error details */}
            {previewData.some(r => !r.valid) && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Errores encontrados:</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {previewData
                    .filter(r => !r.valid)
                    .map(row => (
                      <div key={row.row} className="p-3 border-b border-gray-200 last:border-0 bg-red-50">
                        <p className="text-sm font-medium text-gray-900">Fila {row.row}</p>
                        <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                          {row.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={stats.validRows === 0 || loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Importar {stats.validRows} registros
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
