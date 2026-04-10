/**
 * PayPal Provider Component
 * Wraps children with PayPal Script Provider - Lazy loaded to avoid SSR issues
 */
"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import PayPal components to avoid SSR issues
const DynamicPayPalScriptProvider = dynamic(
  () =>
    import("@paypal/react-paypal-js").then((mod) => mod.PayPalScriptProvider),
  { ssr: false },
);

interface PayPalProviderProps {
  children: ReactNode;
}

export default function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    console.warn("PayPal client ID not configured");
    return <>{children}</>;
  }

  // Determinar si es sandbox (sandbox creds empiezan con 'sb' o contienen 'sandbox')
  const isSandbox =
    clientId.includes("sb") ||
    clientId.startsWith("AY") ||
    clientId.startsWith("AZ") ||
    process.env.NODE_ENV !== "production";

  return (
    <DynamicPayPalScriptProvider
      options={{
        clientId,
        currency: "EUR",
        intent: "capture",
        components: "buttons",
        "disable-funding": "credit,card",
        // Solo usar env sandbox si estamos en desarrollo
        ...(isSandbox && {
          "buyer-country": "ES",
        }),
      }}
    >
      {children}
    </DynamicPayPalScriptProvider>
  );
}
