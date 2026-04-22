/**
 * useCheckout Hook
 * Hook para operaciones de checkout con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface CheckoutInput {
  shippingAddressId: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}

export interface CheckoutData {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentIntent?: {
    clientSecret?: string;
    paymentId?: string;
  };
}

export interface PaymentVerification {
  success: boolean;
  orderId?: string;
  status?: string;
  message?: string;
}

// API Functions
async function createCheckout(input: CheckoutInput): Promise<CheckoutData> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear el checkout');
  }

  const data = await response.json();
  return data;
}

async function verifyCheckout(): Promise<PaymentVerification> {
  const response = await fetch('/api/checkout/verify');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al verificar el checkout');
  }

  const data = await response.json();
  return data;
}

async function confirmPayment(orderId: string, paymentId: string): Promise<void> {
  const response = await fetch('/api/checkout/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, paymentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al confirmar el pago');
  }
}

// React Query Hooks
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCheckout,
    onSuccess: () => {
      // Invalidate cart and orders after checkout creation
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al procesar el checkout');
    },
  });
}

export function useVerifyCheckout() {
  return useQuery({
    queryKey: ['checkout-verification'],
    queryFn: verifyCheckout,
    enabled: false, // Manual trigger only
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, paymentId }: { orderId: string; paymentId: string }) => confirmPayment(orderId, paymentId),
    onSuccess: () => {
      // Invalidate orders after payment confirmation
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Pago confirmado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al confirmar el pago');
    },
  });
}

// Default export
export default useCreateCheckout;
