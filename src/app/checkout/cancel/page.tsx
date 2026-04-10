"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";

/**
 * Checkout Cancel Page
 * Muestra cuando el usuario cancela el pago en Stripe o vuelve atrás
 * Cancela el pedido en la base de datos si se proporciona orderId
 */
function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    // Si hay orderId, cancelar el pedido
    if (orderId && !cancelled) {
      const cancelOrder = async () => {
        setCancelling(true);
        try {
          const response = await fetch("/api/orders/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });

          if (response.ok) {
            setCancelled(true);
          }
        } catch (error) {
          console.error("Error cancelando pedido:", error);
        } finally {
          setCancelling(false);
        }
      };

      cancelOrder();
    }
  }, [orderId, cancelled]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          {/* Icono */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full">
              <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Pago cancelado
          </h1>

          {cancelling ? (
            <div className="mb-6">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-gray-600">Cancelando pedido...</p>
            </div>
          ) : (
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Has cancelado el proceso de pago.{" "}
              {cancelled && "El pedido ha sido cancelado."} Tu carrito sigue
              guardado y puedes intentarlo de nuevo cuando quieras.
            </p>
          )}

          <div className="space-y-3">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              Volver al checkout
            </Link>

            <Link
              href="/cart"
              className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              <ShoppingCart className="h-4 w-4 flex-shrink-0 mr-2" />
              Ver carrito
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            ¿Tienes alguna pregunta?{" "}
            <a
              href="mailto:soporte@3dprint.com"
              className="text-indigo-600 hover:underline"
            >
              Contacta con soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutCancelContent />
    </Suspense>
  );
}
