/**
 * Página de Éxito de Checkout
 * Muestra confirmación después del pago exitoso (Stripe o PayPal)
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';

interface OrderData {
  orderNumber?: string;
  total?: number;
  estado?: string;
  paymentMethod?: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const token = searchParams.get('token'); // PayPal token
  const payerId = searchParams.get('PayerID'); // PayPal payer ID
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

  const verificarPagoPayPal = useCallback(async (paypalToken: string, paypalPayerId: string) => {
    try {
      const response = await fetch(`/api/paypal/verify?token=${paypalToken}&PayerID=${paypalPayerId}`);
      if (response.ok) {
        const data = await response.json();
        return data.order || data.pedido;
      }
      throw new Error('Error verificando pago de PayPal');
    } catch (err) {
      console.error('Error verificando pago PayPal:', err);
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
        } else if (token && payerId) {
          // PayPal payment
          orderData = await verificarPagoPayPal(token, payerId);
        } else {
          setError('No se encontró información del pago');
          setLoading(false);
          return;
        }

        if (orderData) {
          setPedido(orderData);
          clearCart();
        }
      } catch (err) {
        setError('Error al verificar el pago. Por favor, contacta con soporte.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, token, payerId, verificarPagoStripe, verificarPagoPayPal, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                <span className="text-4xl text-red-600">⚠️</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Error en la verificación
            </h1>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Ver mis pedidos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                  <span className="font-medium">{pedido.orderNumber}</span>
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
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Ver mis pedidos
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/products"
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
