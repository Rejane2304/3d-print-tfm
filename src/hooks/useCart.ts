/**
 * useCart Hook
 * Manages shopping cart for both authenticated users (API)
 * and unauthenticated users (localStorage)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

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

// Helper functions for cart operations - moved to outer scope per SonarQube S7721
async function loadCartFromApi(): Promise<CartData> {
  const response = await fetch('/api/cart');
  if (!response.ok) {
    throw new Error('Error al cargar carrito');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error('Error al cargar carrito');
  }
  return data.cart;
}

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

async function addItemToApi(productId: string, quantity: number): Promise<void> {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error adding to cart');
  }
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

async function updateItemInApi(itemId: string, quantity: number): Promise<void> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error updating');
  }
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

async function removeItemFromApi(itemId: string): Promise<void> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error removing item');
  }
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

export function useCart() {
  const { status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipAutoLoadRef = useRef(false);

  const isAuthenticated = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  // Load cart
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

  // Add item to cart
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
        return { success: true };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        };
      }
    },
    [isAuthenticated, loadCart],
  );

  // Update item quantity
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
        return { success: true };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        };
      }
    },
    [isAuthenticated, loadCart],
  );

  // Remove item from cart
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
        return { success: true };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        };
      }
    },
    [isAuthenticated, loadCart],
  );

  // Clear cart (useful for checkout)
  const clearCart = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem(CART_STORAGE_KEY);
        globalThis.dispatchEvent(new Event('cartUpdated'));
      }
      // For authenticated users, cart is cleared on the server during checkout
      await loadCart();
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      };
    }
  }, [isAuthenticated, loadCart]);

  // Migrate cart from localStorage to API (useful when logging in)
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

        // Add each item to API
        for (const item of items) {
          try {
            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.productId,
                quantity: item.quantity,
              }),
            });
          } catch (err) {
            console.error('Error migrating item:', err);
          }
        }

        // Clear localStorage AFTER successful migration
        localStorage.removeItem(CART_STORAGE_KEY);
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
