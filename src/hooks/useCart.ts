/**
 * useCart Hook
 * Manages shopping cart for both authenticated users (API)
 * and unauthenticated users (localStorage)
 */

import { useState, useEffect, useCallback } from 'react';
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

export function useCart() {
  const { status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  // Load cart
  const loadCart = useCallback(async () => {
    if (isLoadingSession) return;

    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        // Load from API
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCart(data.cart);
          }
        } else {
          throw new Error('Error loading cart');
        }
      } else {
        // Load from localStorage
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
          const items: CartItem[] = JSON.parse(cartData);
          const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          );
          setCart({
            id: null,
            items,
            subtotal,
            totalItems,
          });
        } else {
          setCart({
            id: null,
            items: [],
            subtotal: 0,
            totalItems: 0,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLoadingSession]);

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity: number, productInfo: {price?: number; name?: string; slug?: string; stock?: number; image?: string | null}) => {
    try {
      if (isAuthenticated) {
        // Use API
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error adding to cart');
        }
        
        // Reload cart and dispatch event for cross-component updates
        await loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
        return { success: true };
      } else {
        // Use localStorage
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        const items: CartItem[] = cartData ? JSON.parse(cartData) : [];
        
        const existingItem = items.find(item => item.productId === productId);
        
        if (existingItem) {
          // Update quantity
          existingItem.quantity += quantity;
        } else {
          // Add new item
          items.push({
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
          });
        }
        
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        
        // Dispatch event to update counter
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Reload cart
        await loadCart();
        return { success: true };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
      return { success: false, error: err instanceof Error ? err.message : 'Error unknown' };
    }
  }, [isAuthenticated, loadCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (isAuthenticated) {
        // Use API
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error updating');
        }
        
        await loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        // Use localStorage
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
          let items: CartItem[] = JSON.parse(cartData);
          
          if (quantity <= 0) {
            items = items.filter(item => item.id !== itemId);
          } else {
            const item = items.find(i => i.id === itemId);
            if (item) {
              item.quantity = quantity;
            }
          }
          
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
          window.dispatchEvent(new Event('cartUpdated'));
        }
        
        await loadCart();
      }
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
      return { success: false, error: err instanceof Error ? err.message : 'Error unknown' };
    }
  }, [isAuthenticated, loadCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      if (isAuthenticated) {
        // Use API
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error removing item');
        }
        
        await loadCart();
      } else {
        // Use localStorage
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
          let items: CartItem[] = JSON.parse(cartData);
          items = items.filter(item => item.id !== itemId);
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
          window.dispatchEvent(new Event('cartUpdated'));
        }
        
        await loadCart();
      }
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
      return { success: false, error: err instanceof Error ? err.message : 'Error unknown' };
    }
  }, [isAuthenticated, loadCart]);

  // Clear cart (useful for checkout)
  const clearCart = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new Event('cartUpdated'));
      }
      // For authenticated users, cart is cleared on the server during checkout
      await loadCart();
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
      return { success: false, error: err instanceof Error ? err.message : 'Error unknown' };
    }
  }, [isAuthenticated, loadCart]);

  // Migrate cart from localStorage to API (useful when logging in)
  const migrateCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
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
              quantity: item.quantity 
            }),
          });
        } catch (err) {
          console.error('Error migrating item:', err);
        }
      }
      
      // Clear localStorage
      localStorage.removeItem(CART_STORAGE_KEY);
      
      // Reload cart from API
      await loadCart();
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

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [loadCart]);

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
