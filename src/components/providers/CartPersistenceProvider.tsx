'use client';

import { useCartPersistence } from '@/hooks/useCartPersistence';

/**
 * CartPersistenceProvider
 * Componente wrapper que activa la gestión de persistencia del carrito
 * Limpia el carrito de invitados cuando abandonan el sitio
 */
export function CartPersistenceProvider({ children }: { children: React.ReactNode }) {
  useCartPersistence();
  return <>{children}</>;
}
