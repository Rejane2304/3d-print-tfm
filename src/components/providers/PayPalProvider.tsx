/**
 * PayPal Provider Component
 * Wraps children with PayPal Script Provider - Lazy loaded to avoid SSR issues
 */
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, type ReactNode } from 'react';
import type { ReactPayPalScriptOptions } from '@paypal/react-paypal-js';

// Dynamically import PayPal components to avoid SSR issues
const DynamicPayPalScriptProvider = dynamic(
  () => import('@paypal/react-paypal-js').then(mod => mod.PayPalScriptProvider),
  {
    ssr: false,
    loading: () => null,
  },
);

interface PayPalProviderProps {
  children: ReactNode;
}

export default function PayPalProvider({ children }: Readonly<PayPalProviderProps>) {
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Si no hay clientId o hay error, renderizar children sin PayPal
  if (!clientId || hasError) {
    if (!clientId && typeof window !== 'undefined') {
      console.warn('[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado');
    }
    if (hasError) {
      console.warn('[PayPal] Deshabilitado debido a error previo');
    }
    return <>{children}</>;
  }

  // Validar formato del clientId (debe tener cierta longitud mínima)
  if (clientId.length < 20) {
    console.error('[PayPal] Client ID parece inválido (muy corto)');
    return <>{children}</>;
  }

  // Determinar si es sandbox - solo IDs que contienen "sb-" o "sb_"
  const isSandbox = clientId.toLowerCase().includes('sb');

  // Log para debugging (solo en cliente)
  if (isClient && typeof window !== 'undefined') {
    console.log('[PayPal] Modo:', isSandbox ? 'Sandbox' : 'Production');
    console.log('[PayPal] Client ID preview:', clientId.substring(0, 8) + '...');
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
  if (isSandbox) {
    paypalOptions['buyer-country'] = 'ES';
  }

  // Si estamos en SSR, no renderizar el provider todavía
  if (!isClient) {
    return <>{children}</>;
  }

  return <DynamicPayPalScriptProvider options={paypalOptions}>{children}</DynamicPayPalScriptProvider>;
}
