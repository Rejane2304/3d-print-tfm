/**
 * Página de Login - Redirección a /auth
 * Mantiene compatibilidad con URLs antiguas
 */
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión - Redirección",
  robots: "noindex, follow",
};

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  // Construir URL de redirección preservando query params
  const callbackUrl = searchParams.callbackUrl;
  const redirectUrl = callbackUrl
    ? `/auth?callbackUrl=${encodeURIComponent(String(callbackUrl))}`
    : "/auth";

  redirect(redirectUrl);
}
