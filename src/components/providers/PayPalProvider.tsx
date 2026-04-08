/**
 * PayPal Provider Component
 * Wraps children with PayPal Script Provider - Lazy loaded to avoid SSR issues
 */
'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import PayPal components to avoid SSR issues
const DynamicPayPalScriptProvider = dynamic(
  () => import('@paypal/react-paypal-js').then((mod) => mod.PayPalScriptProvider),
  { ssr: false }
);

interface PayPalProviderProps {
  children: ReactNode;
}

export default function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    console.warn('PayPal client ID not configured');
    return <>{children}</>;
  }

  return (
    <DynamicPayPalScriptProvider
      options={{
        clientId,
        currency: 'EUR',
        intent: 'capture',
      }}
    >
      {children}
    </DynamicPayPalScriptProvider>
  );
}
