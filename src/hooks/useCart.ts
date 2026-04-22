/**
 * useCart Hook
 * Manages shopping cart for both authenticated users (API)
 * and unauthenticated users (localStorage)
 *
 * UPDATED: Ahora utiliza los servicios API centralizados para usuarios autenticados
 * mientras mantiene compatibilidad con localStorage para invitados
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import * as cartApi from '@/lib/api/services/cart-api';
// import type { CartError } from '@/lib/api/services/cart-api';
import { useToast } from '@/hooks/useToast';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    image: string | null;
  };
}

export interface CartData {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

const CART_STORAGE_KEY = 'cart';

// ============================================================================
// LocalStorage Helpers (for unauthenticated users)
// ============================================================================

function loadCartFromLocalStorage(): CartData {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (cartData) {
    const items: CartItem[] = JSON.parse(cartData);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
      id: null,
      items,
      subtotal,
      totalItems,
    };
  }
  return {
    id: null,
    items: [],
    subtotal: 0,
    totalItems: 0,
  };
}

function getLocalCartItems(): CartItem[] {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  return cartData ? JSON.parse(cartData) : [];
}

function saveLocalCartItems(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function createCartItem(
  productId: string,
  quantity: number,
  productInfo: {
    price?: number;
    name?: string;
    slug?: string;
    stock?: number;
    image?: string | null;
  },
): CartItem {
  return {
    id: `local-${Date.now()}`,
    productId,
    quantity,
    unitPrice: productInfo.price ?? 0,
    product: {
      id: productId,
      name: productInfo.name ?? 'Unknown',
      slug: productInfo.slug ?? '',
      price: productInfo.price ?? 0,
      stock: productInfo.stock ?? 0,
      image: productInfo.image || null,
    },
  };
}

function updateItemInLocalStorage(itemId: string, quantity: number): void {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (!cartData) {
    return;
  }

  const items: CartItem[] = JSON.parse(cartData);
  let updatedItems: CartItem[];

  if (quantity <= 0) {
    updatedItems = items.filter(item => item.id !== itemId);
  } else {
    updatedItems = items.map(item => (item.id === itemId ? { ...item, quantity } : item));
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
}

function removeItemFromLocalStorage(itemId: string): void {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (!cartData) {
    return;
  }

  const items: CartItem[] = JSON.parse(cartData);
  const filteredItems = items.filter(item => item.id !== itemId);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredItems));
}

// ============================================================================
// API Loaders (using centralized API client)
// ============================================================================

async function loadCartFromApi(): Promise<CartData> {
  return cartApi.getCart();
}

async function addItemToApi(productId: string, quantity: number): Promise<void> {
  const result = await cartApi.addToCart(productId, quantity);
  if (!result.success) {
    throw new Error(result.message);
  }
}

async function updateItemInApi(itemId: string, quantity: number): Promise<void> {
  const result = await cartApi.updateCartItem(itemId, quantity);
  if (!result.success) {
    throw new Error(result.message);
  }
}

async function removeItemFromApi(itemId: string): Promise<void> {
  const result = await cartApi.removeFromCart(itemId);
  if (!result.success) {
    throw new Error(result.message);
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useCart() {
  const { status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipAutoLoadRef = useRef(false);
  const { success: showSuccess, error: showError } = useToast();

  const isAuthenticated = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  /**
   * Load cart data
   * Uses API for authenticated users, localStorage for guests
   */
  const loadCart = useCallback(
    async (force = false) => {
      if (isLoadingSession) {
        return;
      }

      // Skip auto-load if we're in the middle of migration
      if (!force && skipAutoLoadRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (isAuthenticated) {
          const cartData = await loadCartFromApi();
          setCart(cartData);
        } else {
          const cartData = loadCartFromLocalStorage();
          setCart(cartData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isLoadingSession],
  );

  /**
   * Add item to cart
   * Uses API for authenticated users, localStorage for guests
   */
  const addItem = useCallback(
    async (
      productId: string,
      quantity: number,
      productInfo: {
        price?: number;
        name?: string;
        slug?: string;
        stock?: number;
        image?: string | null;
      },
    ) => {
      try {
        if (isAuthenticated) {
          await addItemToApi(productId, quantity);
        } else {
          const items = getLocalCartItems();
          const existingItem = items.find(item => item.productId === productId);

          let updatedItems: CartItem[];
          if (existingItem) {
            updatedItems = items.map(item =>
              item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
            );
          } else {
            const newItem = createCartItem(productId, quantity, productInfo);
            updatedItems = [...items, newItem];
          }
          saveLocalCartItems(updatedItems);
        }

        await loadCart();
        globalThis.dispatchEvent(new Event('cartUpdated'));
        showSuccess('Producto añadido al carrito');
        return { success: true };
      } catch (err) {
        // Handle CartError specifically
        const errorMessage = cartApi.isCartError(err)
          ? cartApi.getCartErrorMessage(err)
          : err instanceof Error
            ? err.message
            : 'Error desconocido';
        setError(errorMessage);
        showError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isAuthenticated, loadCart, showSuccess, showError],
  );

  /**
   * Update item quantity
   * Uses API for authenticated users, localStorage for guests
   */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        if (isAuthenticated) {
          await updateItemInApi(itemId, quantity);
        } else {
          updateItemInLocalStorage(itemId, quantity);
        }

        await loadCart();
        globalThis.dispatchEvent(new Event('cartUpdated'));
        showSuccess('Cantidad actualizada');
        return { success: true };
      } catch (err) {
        const errorMessage = cartApi.isCartError(err)
          ? cartApi.getCartErrorMessage(err)
          : err instanceof Error
            ? err.message
            : 'Error desconocido';
        setError(errorMessage);
        showError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isAuthenticated, loadCart, showSuccess, showError],
  );

  /**
   * Remove item from cart
   * Uses API for authenticated users, localStorage for guests
   */
  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        if (isAuthenticated) {
          await removeItemFromApi(itemId);
        } else {
          removeItemFromLocalStorage(itemId);
        }

        await loadCart();
        globalThis.dispatchEvent(new Event('cartUpdated'));
        showSuccess('Producto eliminado del carrito');
        return { success: true };
      } catch (err) {
        const errorMessage = cartApi.isCartError(err)
          ? cartApi.getCartErrorMessage(err)
          : err instanceof Error
            ? err.message
            : 'Error desconocido';
        setError(errorMessage);
        showError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isAuthenticated, loadCart, showSuccess, showError],
  );

  /**
   * Clear cart
   * Clears localStorage for guests, API handles clearing for authenticated users
   */
  const clearCart = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem(CART_STORAGE_KEY);
        globalThis.dispatchEvent(new Event('cartUpdated'));
      } else {
        // For authenticated users, cart is cleared on the server during checkout
        await cartApi.clearCart();
      }
      await loadCart();
      showSuccess('Carrito vaciado');
      return { success: true };
    } catch (err) {
      const errorMessage = cartApi.isCartError(err)
        ? cartApi.getCartErrorMessage(err)
        : err instanceof Error
          ? err.message
          : 'Error desconocido';
      setError(errorMessage);
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [isAuthenticated, loadCart, showSuccess, showError]);

  /**
   * Migrate cart from localStorage to API (when logging in)
   * Uses the centralized API client for better error handling
   */
  const migrateCart = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    // Set flag to prevent auto-load during migration
    skipAutoLoadRef.current = true;

    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const items: CartItem[] = JSON.parse(cartData);
        const itemsToMigrate = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        // Use centralized API client for migration
        const result = await cartApi.migrateLocalCart(itemsToMigrate);

        if (result.success) {
          // Clear localStorage AFTER successful migration
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          console.warn('Some items failed to migrate:', result.errors);
        }
      }

      // Reload cart from API with force=true
      await loadCart(true);
      return { success: true };
    } catch (err) {
      console.error('Migration error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error en migración',
      };
    } finally {
      skipAutoLoadRef.current = false;
    }
  }, [isAuthenticated, loadCart]);

  // Load initial cart
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    globalThis.addEventListener('cartUpdated', handleCartUpdate);
    return () => globalThis.removeEventListener('cartUpdated', handleCartUpdate);
  }, [loadCart]);

  // Listen for auth changes to reload cart
  useEffect(() => {
    // When session status changes from loading/unauthenticated to authenticated
    // Force reload cart from API
    if (status === 'authenticated') {
      // Small delay to allow any migration to complete
      const timeout = setTimeout(() => {
        void loadCart(true);
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [status, loadCart]);

  return {
    cart,
    loading,
    error,
    setError,
    isAuthenticated,
    loadCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    migrateCart,
  };
}
