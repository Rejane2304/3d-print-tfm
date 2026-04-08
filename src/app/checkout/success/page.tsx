'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderData {
  orderNumber?: string;
  total?: number;
  estado?: string;
  paymentMethod?: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId'); // Para verificación directa por ID
  const [pedido, setPedido] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificarPagoStripe = useCallback(async (sid: string) => {
    try {
      const response = await fetch(`/api/checkout/verify?session_id=${sid}`);
      if (response.ok) {
        const data = await response.json();
        return data.order || data.pedido;
      }
      throw new Error('Error verificando pago de Stripe');
    } catch (err) {
      console.error('Error verificando pago Stripe:', err);
      throw err;
    }
  }, []);

  const verificarPedidoPorId = useCallback(async (oid: string) => {
    try {
      const response = await fetch(`/api/account/orders/${oid}`);
      if (response.ok) {
        const data = await response.json();
        return data.pedido;
      }
      throw new Error('Error verificando pedido');
    } catch (err) {
      console.error('Error verificando pedido por ID:', err);
      throw err;
    }
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'));
    }, 100);
  }, []);

  useEffect(() => {
    const verifyPayment = async () => {
      setLoading(true);
      setError(null);

      try {
        let orderData: OrderData | null = null;

        if (sessionId) {
          // Stripe payment
          orderData = await verificarPagoStripe(sessionId);
        } else if (orderId) {
          // Verificación por ID de pedido (PayPal o redirección directa)
          orderData = await verificarPedidoPorId(orderId);
        } else {
          setError('No se encontró información del pago');
          setLoading(false);
          return;
        }

        if (orderData) {
          setPedido(orderData);
          clearCart();
        }
      } catch {
        setError('Error al verificar el pago. Por favor, contacta con soporte.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, orderId, verificarPagoStripe, verificarPedidoPorId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Verificando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full">
                <span className="text-2xl sm:text-4xl text-red-600">⚠️</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Error en la verificación
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">{error}</p>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              Ver mis pedidos
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          {/* Icono de éxito */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            ¡Pago completado!
          </h1>

          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
            Tu pedido ha sido procesado correctamente. Te enviaremos un email con los detalles.
          </p>

          {pedido && (
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <span className="font-semibold">Detalles del pedido</span>
              </div>

              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Número de pedido:</span>
                  <span className="font-medium">{pedido.orderNumber}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{Number(pedido.total).toFixed(2)} €</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Pagado</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              Ver mis pedidos
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página de Éxito de Checkout
 * Muestra confirmación después del pago exitoso (Stripe o PayPal)
 */
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
