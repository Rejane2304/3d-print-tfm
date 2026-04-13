'use client';

import { useEffect, useState } from 'react';
import type { Cart } from './useCheckoutData';

interface UseCancelledOrderResult {
  cancelledOrderId: string | null;
  restoreCart: () => Promise<void>;
  dismissCancelledOrder: () => void;
}

export function useCancelledOrder(setCart: (cart: Cart | null) => void): UseCancelledOrderResult {
  const [cancelledOrderId, setCancelledOrderId] = useState<string | null>(null);

  useEffect(() => {
    const checkCancelledPayment = () => {
      const urlParams = new URLSearchParams(globalThis.location.search);
      const cancelled = urlParams.get('cancelled');
      const orderId = urlParams.get('orderId');

      if (cancelled === 'true' && orderId) {
        setCancelledOrderId(orderId);
        globalThis.history.replaceState({}, '', '/checkout');

        // Cancelar el pedido en el backend
        void (async () => {
          try {
            await fetch('/api/orders/cancel-and-restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId }),
            });
          } catch {
            // Silenciar error
          }
        })();
      }
    };

    checkCancelledPayment();
  }, []);

  const restoreCart = async () => {
    if (!cancelledOrderId) {
      return;
    }

    try {
      const response = await fetch('/api/cart/restore-from-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: cancelledOrderId }),
      });

      if (response.ok) {
        const cartRes = await fetch('/api/cart');
        if (cartRes.ok) {
          const data = await cartRes.json();
          setCart(data.cart as Cart);
        }
        setCancelledOrderId(null);
      }
    } catch (err) {
      console.error('Error restaurando carrito:', err);
    }
  };

  const dismissCancelledOrder = () => {
    setCancelledOrderId(null);
  };

  return {
    cancelledOrderId,
    restoreCart,
    dismissCancelledOrder,
  };
}
