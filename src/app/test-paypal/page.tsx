/**
 * PayPal Test Page
 * Simple page to test PayPal integration
 */
'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function PayPalTestPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const createOrder = async () => {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total: 10.00,
        orderId: 'test-order-123',
      }),
    });
    const data = await response.json();
    return data.paypalOrderId;
  };

  const onApprove = async (data: { orderID: string }) => {
    const response = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paypalOrderId: data.orderID,
        orderId: 'test-order-123',
      }),
    });
    
    if (response.ok) {
      setStatus('success');
      setMessage('Payment successful! PayPal is working correctly.');
    } else {
      setStatus('error');
      setMessage('Payment failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">PayPal Test</h1>
        <p className="text-gray-600 text-center mb-6">
          Test amount: €10.00
        </p>

        {status === 'idle' && (
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
              currency: 'EUR',
              intent: 'capture',
            }}
          >
            <PayPalButtons
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => {
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'PayPal error');
              }}
            />
          </PayPalScriptProvider>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-medium">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Test Again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-600">
          <p className="font-medium mb-2">Troubleshooting:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Open browser console (F12)</li>
            <li>Check Network tab for API calls</li>
            <li>Verify PayPal SDK loads</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
