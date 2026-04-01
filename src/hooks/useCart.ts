/**
 * Hook useCart
 * Maneja el carrito de compras tanto para usuarios autenticados (API)
 * como para usuarios no autenticados (localStorage)
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface CartItem {
  id: string;
  productoId: string;
  quantity: number;
  unitPrice: number;
  producto: {
    id: string;
    nombre: string;
    slug: string;
    price: number;
    stock: number;
    imagen: string | null;
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

  // Cargar carrito
  const loadCart = useCallback(async () => {
    if (isLoadingSession) return;

    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        // Cargar desde API
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCart(data.carrito);
          }
        } else {
          throw new Error('Error al cargar el carrito');
        }
      } else {
        // Cargar desde localStorage
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
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLoadingSession]);

  // Añadir item al carrito
  const addItem = useCallback(async (productoId: string, quantity: number, productoInfo: any) => {
    try {
      if (isAuthenticated) {
        // Usar API
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productoId, quantity }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al añadir al carrito');
        }
        
        // Recargar carrito
        await loadCart();
        return { success: true };
      } else {
        // Usar localStorage
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        const items: CartItem[] = cartData ? JSON.parse(cartData) : [];
        
        const existingItem = items.find(item => item.productoId === productoId);
        
        if (existingItem) {
          // Actualizar cantidad
          existingItem.quantity += quantity;
        } else {
          // Añadir nuevo item
          items.push({
            id: `local-${Date.now()}`,
            productoId,
            quantity,
            unitPrice: productoInfo.price,
            producto: {
              id: productoId,
              nombre: productoInfo.nombre,
              slug: productoInfo.slug,
              price: productoInfo.price,
              stock: productoInfo.stock,
              imagen: productoInfo.imagen || null,
            },
          });
        }
        
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        
        // Disparar evento para actualizar el contador
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Recargar carrito
        await loadCart();
        return { success: true };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }, [isAuthenticated, loadCart]);

  // Actualizar cantidad de un item
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (isAuthenticated) {
        // Usar API
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al actualizar');
        }
        
        await loadCart();
      } else {
        // Usar localStorage
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
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }, [isAuthenticated, loadCart]);

  // Eliminar item del carrito
  const removeItem = useCallback(async (itemId: string) => {
    try {
      if (isAuthenticated) {
        // Usar API
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al eliminar');
        }
        
        await loadCart();
      } else {
        // Usar localStorage
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
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }, [isAuthenticated, loadCart]);

  // Vaciar carrito (útil para checkout)
  const clearCart = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new Event('cartUpdated'));
      }
      // Para usuarios autenticados, el carrito se vacía en el servidor durante el checkout
      await loadCart();
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }, [isAuthenticated, loadCart]);

  // Migrar carrito de localStorage a la API (útil al loguearse)
  const migrateCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (cartData) {
      const items: CartItem[] = JSON.parse(cartData);
      
      // Añadir cada item a la API
      for (const item of items) {
        try {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productoId: item.productoId, 
              quantity: item.quantity 
            }),
          });
        } catch (err) {
          console.error('Error migrando item:', err);
        }
      }
      
      // Limpiar localStorage
      localStorage.removeItem(CART_STORAGE_KEY);
      
      // Recargar carrito desde API
      await loadCart();
    }
  }, [isAuthenticated, loadCart]);

  // Cargar carrito inicial
  useEffect(() => {
    loadCart();
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
