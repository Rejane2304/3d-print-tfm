/**
 * Hook para manejar la migración del carrito desde localStorage
 */
import { useCallback } from 'react';

interface CartItem {
  productId: string;
  quantity: number;
}

interface MigrationResult {
  success: boolean;
  productId?: string;
  error?: unknown;
}

export function useCartMigration() {
  const cartStorageKey = 'cart';

  const getLocalCart = useCallback((): CartItem[] | null => {
    const localCart = localStorage.getItem(cartStorageKey);
    if (!localCart) return null;
    
    try {
      const items = JSON.parse(localCart) as CartItem[];
      return items.length > 0 ? items : null;
    } catch {
      return null;
    }
  }, []);

  const hasItemsToMigrate = useCallback((): boolean => {
    return getLocalCart() !== null;
  }, [getLocalCart]);

  const setMigrationFlag = useCallback(() => {
    if (hasItemsToMigrate()) {
      sessionStorage.setItem('migratingCart', 'true');
    }
  }, [hasItemsToMigrate]);

  const clearMigrationFlag = useCallback(() => {
    sessionStorage.removeItem('migratingCart');
  }, []);

  const migrateItem = async (item: CartItem): Promise<MigrationResult> => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to migrate item:', item.productId, errorData);
        return { success: false, productId: item.productId, error: errorData };
      }

      return { success: true, productId: item.productId };
    } catch (error) {
      console.error('Error migrating item:', item.productId, error);
      return { success: false, productId: item.productId, error };
    }
  };

  const migrateCart = async (): Promise<void> => {
    const items = getLocalCart();
    if (!items) return;

    try {
      // Migrar cada item
      await Promise.allSettled(items.map(migrateItem));

      // Limpiar localStorage después de la migración
      localStorage.removeItem(cartStorageKey);
    } catch (err) {
      console.error('Error migrating cart:', err);
    }
  };

  return {
    getLocalCart,
    hasItemsToMigrate,
    setMigrationFlag,
    clearMigrationFlag,
    migrateCart,
  };
}
