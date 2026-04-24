/**
 * Products Error Boundary
 * Error boundary específico para el catálogo de productos
 */
'use client';

import { useEffect } from 'react';
import { PackageX, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ProductsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('Products error boundary caught:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  // Determine if this is a connection/database error
  const isConnectionError =
    error.message?.toLowerCase().includes('connection') ||
    error.message?.toLowerCase().includes('prisma') ||
    error.message?.toLowerCase().includes('database');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PackageX className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al Cargar Productos</h1>

          <p className="text-gray-600 mb-2">No pudimos cargar el catálogo de productos en este momento.</p>

          {isConnectionError && (
            <p className="text-sm text-amber-600 mb-6">
              Parece haber un problema de conexión con el servidor. Por favor, intenta de nuevo en unos momentos.
            </p>
          )}

          {error.digest && <p className="text-xs text-gray-400 mb-6">Error ID: {error.digest}</p>}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="h-4 w-4" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
