'use client';

import { useCartPersistence } from '@/hooks/useCartPersistence';

/**
 * CartPersistenceProvider
 * Wrapper component that activates cart persistence management
 * Clears guest cart when they leave the site
 */
export function CartPersistenceProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useCartPersistence();
  return <>{children}</>;
}
