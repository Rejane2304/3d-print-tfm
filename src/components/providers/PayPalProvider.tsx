/**
 * PayPal Provider Component
 * Wraps children with PayPal Script Provider - Lazy loaded to avoid SSR issues
 */
'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamically import PayPal components to avoid SSR issues
const DynamicPayPalScriptProvider = dynamic(
  () => import('@paypal/react-paypal-js').then(mod => mod.PayPalScriptProvider),
  { ssr: false },
);

interface PayPalProviderProps {
  children: ReactNode;
}

export default function PayPalProvider({ children }: Readonly<PayPalProviderProps>) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return <>{children}</>;
  }

  // Determinar si es sandbox
  // Sandbox IDs típicamente contienen "sb" en el string
  // Los IDs de producción también empiezan con 'A' y son largos, no usar esos criterios
  const isSandbox = clientId.toLowerCase().includes('sb');

  return (
    <DynamicPayPalScriptProvider
      options={{
        clientId,
        currency: 'EUR',
        intent: 'capture',
        components: 'buttons',
        'disable-funding': 'credit,card',
        // buyer-country solo funciona en sandbox, no en producción
        ...(isSandbox && {
          'buyer-country': 'ES',
        }),
      }}
    >
      {children}
    </DynamicPayPalScriptProvider>
  );
}
