'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export type PaymentMethod = 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER';

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'CARD',
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con tarjeta',
    iconName: 'CreditCard',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal',
    description: 'Pago rápido con PayPal',
    iconName: 'Wallet',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'BIZUM',
    name: 'Bizum',
    description: 'Pago instantáneo desde tu móvil',
    iconName: 'Banknote',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'TRANSFER',
    name: 'Transferencia bancaria',
    description: 'Transferencia a nuestra cuenta',
    iconName: 'ArrowRightLeft',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

interface PaymentResult {
  success: boolean;
  error?: string;
}

interface UsePaymentProcessingResult {
  processing: boolean;
  error: string | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  processPayment: (selectedAddressId: string) => Promise<PaymentResult>;
}

export function usePaymentProcessing(): UsePaymentProcessingResult {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');

  const processCardPayment = async(orderId: string, paymentId: string) => {
    const stripeResponse = await fetch('/api/payments/stripe/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId }),
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      throw new Error(stripeData.error || 'Error al iniciar pago con Stripe');
    }

    return stripeData.url as string;
  };

  const processPayPalPayment = async(orderId: string, paymentId: string) => {
    const paypalResponse = await fetch('/api/payments/paypal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId }),
    });

    const paypalData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      throw new Error(paypalData.error || 'Error al iniciar pago con PayPal');
    }

    // Guardar el paypalOrderId para recuperarlo después
    localStorage.setItem('pendingPayPalOrderId', orderId);
    localStorage.setItem('pendingPayPalToken', (paypalData.paypalOrderId as string) || '');

    return paypalData.url as string;
  };

  const processPayment = useCallback(
    async(selectedAddressId: string): Promise<PaymentResult> => {
      if (!selectedAddressId) {
        setError('Selecciona una dirección de envío');
        return { success: false, error: 'Selecciona una dirección de envío' };
      }

      try {
        setProcessing(true);
        setError(null);

        // Step 1: Create order in PENDING status
        const checkoutResponse = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddressId: selectedAddressId,
            paymentMethod: paymentMethod,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
          throw new Error(checkoutData.error || 'Error al crear el pedido');
        }

        const { orderId, paymentId } = checkoutData as {
          orderId: string;
          paymentId: string;
        };

        // Step 2: Route to specific payment method
        switch (paymentMethod) {
          case 'CARD': {
            const stripeUrl = await processCardPayment(orderId, paymentId);
            globalThis.open(stripeUrl, '_blank');
            return { success: true };
          }

          case 'PAYPAL': {
            const paypalUrl = await processPayPalPayment(orderId, paymentId);
            globalThis.open(paypalUrl, '_blank');
            return { success: true };
          }

          case 'BIZUM':
          case 'TRANSFER': {
            // Fake payments - Go to processing page
            router.push(
              `/checkout/processing?orderId=${orderId}&paymentId=${paymentId}&method=${paymentMethod.toLowerCase()}`,
            );
            return { success: true };
          }

          default:
            throw new Error('Método de pago no soportado');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setProcessing(false);
      }
    },
    [paymentMethod, router]
  );

  return {
    processing,
    error,
    paymentMethod,
    setPaymentMethod,
    processPayment,
  };
}
