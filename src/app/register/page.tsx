/**
 * Página de Registro - Redirección a /auth
 * Mantiene compatibilidad con URLs antiguas
 */
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro - Redirección',
  robots: 'noindex, follow',
};

interface RegistroPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RegistroPage({ searchParams }: RegistroPageProps) {
  // Redirigir a /auth con tab=register
  const callbackUrl = searchParams.callbackUrl;
  const redirectUrl = callbackUrl 
    ? `/auth?tab=register&callbackUrl=${encodeURIComponent(String(callbackUrl))}`
    : '/auth?tab=register';
  
  redirect(redirectUrl);
}
