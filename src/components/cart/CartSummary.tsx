/**
 * CartSummary Component
 * Resumen del carrito de compras con totales y botón de checkout
 * Responsive: mobile → desktop
 */
'use client';

import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';

interface CartSummaryProps {
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    producto: {
      nombre: string;
      price: number;
    };
  }>;
  subtotal: number;
  gastosEnvio?: number;
  envioGratisDesde?: number;
  impuestosIncluidos?: boolean;
  isProcessing?: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export default function CartSummary({
  items,
  subtotal,
  gastosEnvio = 5.99,
  envioGratisDesde = 50,
  impuestosIncluidos = true,
  isProcessing = false,
  onCheckout,
  onContinueShopping,
}: CartSummaryProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const envioGratis = subtotal >= envioGratisDesde;
  const envio = envioGratis ? 0 : gastosEnvio;
  const total = subtotal + envio;
  const hayItems = items.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        Resumen del pedido
      </h2>

      {hayItems ? (
        <>
          {/* Items count */}
          <div className="mb-4 text-sm text-gray-600">
            {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
          </div>

          {/* Subtotal */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{subtotal.toFixed(2)} €</span>
          </div>

          {/* Envío */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Envío</span>
            <span className={envioGratis ? 'text-green-600 font-medium' : 'font-medium'}>
              {envioGratis ? 'Gratis' : `${envio.toFixed(2)} €`}
            </span>
          </div>

          {/* Info envío gratis */}
          {!envioGratis && subtotal > 0 && (
            <div className="text-sm text-blue-600 mt-2">
              Te falta {(envioGratisDesde - subtotal).toFixed(2)} € para envío gratis
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between py-4 mt-4 border-t-2 border-gray-200">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              {total.toFixed(2)} €
            </span>
          </div>

          {/* Impuestos incluidos */}
          {impuestosIncluidos && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Impuestos incluidos
            </p>
          )}

          {/* Botones de acción */}
          <div className="space-y-3 mt-6">
            <button
              type="button"
              onClick={onCheckout}
              disabled={isProcessing || !hayItems}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Proceder al pago
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onContinueShopping}
              disabled={isProcessing}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        </>
      ) : (
        /* Carrito vacío */
        <div className="text-center py-8">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tu carrito está vacío
          </h3>
          <p className="text-gray-500 mb-6">
            Añade algunos productos para continuar
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="bg-indigo-600 text-white py-2 px-6 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Explorar productos
          </button>
        </div>
      )}
    </div>
  );
}
