/**
 * Hook para manejar la migración del carrito desde localStorage
 * Optimizado para producción con manejo de errores
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
    if (!localCart) {
      return null;
    }

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
    sessionStorage.removeItem('cartMigrated');
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
        return { success: false, productId: item.productId, error: errorData };
      }

      return { success: true, productId: item.productId };
    } catch {
      return { success: false, productId: item.productId, error: new Error('Migration failed') };
    }
  };

  const migrateCart = async (): Promise<{ success: boolean; migratedCount: number }> => {
    const items = getLocalCart();
    if (!items) {
      return { success: true, migratedCount: 0 };
    }

    try {
      // Migrar cada item secuencialmente para evitar sobrecarga
      let migratedCount = 0;
      for (const item of items) {
        const result = await migrateItem(item);
        if (result.success) {
          migratedCount++;
        }
      }

      // Limpiar localStorage después de la migración exitosa
      localStorage.removeItem(cartStorageKey);

      // Esperar un momento para que la BD se sincronice
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true, migratedCount };
    } catch (error) {
      console.error('Cart migration error:', error);
      return { success: false, migratedCount: 0 };
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
