/**
 * API Hooks
 * React hooks que envuelven los servicios API
 * Proporcionan estado de carga, error y cache
 * @module lib/api/hooks
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type {
  CartResponse,
  ProductResponse,
  ProductsListResponse,
  OrderResponse,
  ProductSearchParams,
  CheckoutResponse,
} from '@/types/api';
import * as cartApi from './services/cart-api';
import * as productsApi from './services/products-api';
import * as ordersApi from './services/orders-api';
import * as checkoutApi from './services/checkout-api';

// ============================================================================
// Types
// ============================================================================

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

type UseApiReturn<T> = UseApiState<T> & {
  refetch: () => Promise<void>;
  clearError: () => void;
};

// ============================================================================
// Cart Hook
// ============================================================================

/**
 * Hook para gestionar el carrito del usuario autenticado
 * Reemplaza parcialmente useCart para usuarios autenticados
 * Mantiene compatibilidad con localStorage para invitados
 * @returns Estado del carrito y funciones de gestión
 */
export function useApiCart(): UseApiReturn<CartResponse> & {
  addItem: (productId: string, quantity: number) => Promise<{ success: boolean }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean }>;
  removeItem: (itemId: string) => Promise<{ success: boolean }>;
  clearCart: () => Promise<{ success: boolean }>;
  migrateFromLocal: (items: Array<{ productId: string; quantity: number }>) => Promise<void>;
} {
  const { status } = useSession();
  const [state, setState] = useState<UseApiState<CartResponse>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const isAuthenticated = status === 'authenticated';

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await cartApi.getCart();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (productId: string, quantity: number): Promise<{ success: boolean }> => {
      if (!isAuthenticated) return { success: false };

      try {
        await cartApi.addToCart(productId, quantity);
        await fetchCart();
        return { success: true };
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return { success: false };
      }
    },
    [isAuthenticated, fetchCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<{ success: boolean }> => {
      if (!isAuthenticated) return { success: false };

      try {
        await cartApi.updateCartItem(itemId, quantity);
        await fetchCart();
        return { success: true };
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return { success: false };
      }
    },
    [isAuthenticated, fetchCart],
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<{ success: boolean }> => {
      if (!isAuthenticated) return { success: false };

      try {
        await cartApi.removeFromCart(itemId);
        await fetchCart();
        return { success: true };
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return { success: false };
      }
    },
    [isAuthenticated, fetchCart],
  );

  const clearCartFn = useCallback(async (): Promise<{ success: boolean }> => {
    if (!isAuthenticated) return { success: false };

    try {
      await cartApi.clearCart();
      await fetchCart();
      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
      return { success: false };
    }
  }, [isAuthenticated, fetchCart]);

  const migrateFromLocal = useCallback(
    async (items: Array<{ productId: string; quantity: number }>): Promise<void> => {
      if (!isAuthenticated || items.length === 0) return;

      await cartApi.migrateLocalCart(items);
      await fetchCart();
    },
    [isAuthenticated, fetchCart],
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    ...state,
    refetch: fetchCart,
    clearError,
    addItem,
    updateQuantity,
    removeItem,
    clearCart: clearCartFn,
    migrateFromLocal,
  };
}

// ============================================================================
// Products Hook
// ============================================================================

/**
 * Hook para obtener el catálogo de productos
 * @param params - Parámetros de búsqueda y filtrado
 * @returns Lista de productos paginada
 */
export function useApiProducts(params: ProductSearchParams = {}): UseApiReturn<ProductsListResponse> {
  const [state, setState] = useState<UseApiState<ProductsListResponse>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchProducts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await productsApi.getProducts(params);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [params]); // Dependencia correcta

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    ...state,
    refetch: fetchProducts,
    clearError,
  };
}

/**
 * Hook para obtener un producto específico
 * @param slug - Slug del producto
 * @returns Producto
 */
export function useApiProduct(slug: string | null): UseApiReturn<ProductResponse> {
  const [state, setState] = useState<UseApiState<ProductResponse>>({
    data: null,
    isLoading: !!slug,
    error: null,
  });

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await productsApi.getProduct(slug);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [slug]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    ...state,
    refetch: fetchProduct,
    clearError,
  };
}

// ============================================================================
// Orders Hook
// ============================================================================

/**
 * Hook para obtener los pedidos del usuario
 * @returns Lista de pedidos
 */
export function useApiOrders(): UseApiReturn<OrderResponse[]> {
  const { status } = useSession();
  const [state, setState] = useState<UseApiState<OrderResponse[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const isAuthenticated = status === 'authenticated';

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await ordersApi.getOrders();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    ...state,
    refetch: fetchOrders,
    clearError,
  };
}

/**
 * Hook para obtener un pedido específico
 * @param orderId - ID del pedido
 * @returns Pedido con detalles
 */
export function useApiOrder(orderId: string | null): UseApiReturn<OrderResponse> {
  const { status } = useSession();
  const [state, setState] = useState<UseApiState<OrderResponse>>({
    data: null,
    isLoading: !!orderId,
    error: null,
  });

  const isAuthenticated = status === 'authenticated';

  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await ordersApi.getOrder(orderId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [isAuthenticated, orderId]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    ...state,
    refetch: fetchOrder,
    clearError,
  };
}

// ============================================================================
// Checkout Hook
// ============================================================================

interface UseCheckoutState {
  checkout: CheckoutResponse | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseCheckoutReturn extends UseCheckoutState {
  createCheckout: (
    shippingAddressId: string,
    paymentMethod: 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
    couponCode?: string,
  ) => Promise<CheckoutResponse | null>;
  clearError: () => void;
}

/**
 * Hook para gestionar el proceso de checkout
 * @returns Estado del checkout y función para crearlo
 */
export function useApiCheckout(): UseCheckoutReturn {
  const [state, setState] = useState<UseCheckoutState>({
    checkout: null,
    isLoading: false,
    error: null,
  });

  const createCheckoutFn = useCallback(
    async (
      shippingAddressId: string,
      paymentMethod: 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
      couponCode?: string,
    ): Promise<CheckoutResponse | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await checkoutApi.createCheckout(shippingAddressId, paymentMethod, couponCode);
        setState({ checkout: data, isLoading: false, error: null });
        return data;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return null;
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createCheckout: createCheckoutFn,
    clearError,
  };
}

// ============================================================================
// Export all hooks
// ============================================================================

const apiHooks = {
  useApiCart,
  useApiProducts,
  useApiProduct,
  useApiOrders,
  useApiOrder,
  useApiCheckout,
};

export default apiHooks;
