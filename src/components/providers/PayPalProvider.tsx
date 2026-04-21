/**
 * PayPal Provider Component
 * Wraps children with PayPal Script Provider - Lazy loaded to avoid SSR issues
 */
'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import type { ReactPayPalScriptOptions } from '@paypal/react-paypal-js';

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
    console.warn('PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado');
    return <>{children}</>;
  }

  // Determinar si es sandbox
  // Sandbox IDs típicamente contienen "sb" en el string
  const isSandbox = clientId.toLowerCase().includes('sb');

  // Log para debugging
  if (typeof window !== 'undefined') {
    console.log('PayPal Mode:', isSandbox ? 'Sandbox' : 'Production');
    console.log('PayPal Client ID (first 10 chars):', clientId.substring(0, 10) + '...');
  }

  // Opciones base para PayPal
  const paypalOptions: ReactPayPalScriptOptions = {
    clientId,
    currency: 'EUR',
    intent: 'capture',
    components: 'buttons',
    'disable-funding': 'credit,card',
  };

  // Solo añadir buyer-country en sandbox
  // En producción, esta opción causa error 400
  if (isSandbox) {
    paypalOptions['buyer-country'] = 'ES';
  }

  return <DynamicPayPalScriptProvider options={paypalOptions}>{children}</DynamicPayPalScriptProvider>;
}
