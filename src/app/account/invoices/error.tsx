/**
 * Account Invoices Error Boundary
 * Captures errors in the account invoices section
 */
'use client';

import { useEffect } from 'react';
import { FileText, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AccountInvoicesErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AccountInvoicesError] Error caught:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al Cargar Facturas</h1>

          <p className="text-gray-600 mb-6">
            No pudimos cargar tus facturas en este momento. Por favor, intenta de nuevo.
          </p>

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
              href="/account"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="h-4 w-4" />
              Volver a Mi Cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
