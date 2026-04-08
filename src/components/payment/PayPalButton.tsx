/**
 * PayPal Payment Button Component
 * Integrates PayPal SDK for checkout payments
 */
'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  total: number;
  orderId?: string;
  onSuccess: (details: unknown) => void;
  onError: (error: Error) => void;
}

export default function PayPalButton({ total, orderId, onSuccess, onError }: PayPalButtonProps) {
  // Validate that orderId is provided
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating PayPal order');
      }

      return data.paypalOrderId;
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Error al crear orden'));
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          orderId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Error capturing payment');
      }

      onSuccess(responseData);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Error capturing payment'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4 px-4">
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-indigo-600 flex-shrink-0" />
        <span className="ml-2 text-gray-600 text-sm sm:text-base">Cargando PayPal...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => onError(err instanceof Error ? err : new Error('PayPal error'))}
        onCancel={() => onError(new Error('Pago cancelado por el usuario'))}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        }}
      />
    </div>
  );
}
