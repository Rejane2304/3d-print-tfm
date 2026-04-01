/**
 * Página de Éxito de Checkout
 * Muestra confirmación después del pago exitoso
 */
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Verificar estado del pago
      verificarPago();
    }
  }, [sessionId]);

  const verificarPago = async () => {
    try {
      const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
      }
    } catch (error) {
      console.error('Error verificando pago:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Icono de éxito */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago completado!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Tu pedido ha sido procesado correctamente. Te enviaremos un email con los detalles.
          </p>

          {pedido && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold">Detalles del pedido</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de pedido:</span>
                  <span className="font-medium">{pedido.numeroPedido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{Number(pedido.total).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Pagado</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/cuenta/pedidos"
              className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Ver mis pedidos
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/productos"
              className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
