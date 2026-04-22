/**
 * Checkout Error Boundary
 * Error boundary específico para el proceso de checkout
 */
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Checkout error boundary caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Error en el Pago</h1>
        <p className="text-gray-600 text-center mb-6">
          {error.message || 'Ha ocurrido un error durante el proceso de pago. No te preocupes, tu carrito está seguro.'}
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Nota importante:</strong> Si ya realizaste un pago y ves este error, no intentes pagar de nuevo.
            Contacta con nosotros para verificar el estado de tu pedido.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>

          <Link
            href="/cart"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Volver al Carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
