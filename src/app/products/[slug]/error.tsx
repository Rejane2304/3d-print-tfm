/**
 * Product Detail Error Boundary
 * Error boundary específico para la página de detalle de producto
 */
'use client';

import { useEffect } from 'react';
import { PackageX, RefreshCw, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('[ProductDetailError] Error caught:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  // Determine if this is a connection/database error
  const isConnectionError =
    error.message?.toLowerCase().includes('connection') ||
    error.message?.toLowerCase().includes('prisma') ||
    error.message?.toLowerCase().includes('database') ||
    error.digest === '2857024813'; // Specific digest for server render errors

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <PackageX className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isConnectionError ? 'Error de Conexión' : 'Producto no Disponible'}
          </h1>

          <p className="text-gray-600 mb-2">
            {isConnectionError
              ? 'No pudimos cargar los detalles del producto debido a un problema de conexión.'
              : 'El producto que estás buscando no está disponible o ha sido eliminado.'}
          </p>

          {isConnectionError && (
            <p className="text-sm text-amber-600 mb-6">
              Por favor, verifica tu conexión a internet e intenta de nuevo en unos momentos.
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
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4" />
              Ver Productos
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
