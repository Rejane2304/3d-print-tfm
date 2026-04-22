/**
 * useCartQuery Hook
 * Hook de React Query para operaciones de carrito
 * Nota: Este es un hook complementario, NO reemplaza useCart.ts existente
 * Fase 2: Migrar completamente de useCart.ts a este hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Types
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

interface AddToCartInput {
  productId: string;
  quantity: number;
  productInfo?: {
    price?: number;
    name?: string;
    slug?: string;
    stock?: number;
    image?: string | null;
  };
}

interface UpdateCartItemInput {
  itemId: string;
  quantity: number;
}

// API Functions
async function getCart(): Promise<CartData> {
  const response = await fetch('/api/cart');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar el carrito');
  }

  const data = await response.json();
  return data.cart;
}

async function addToCart(input: AddToCartInput): Promise<void> {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: input.productId,
      quantity: input.quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al añadir al carrito');
  }
}

async function updateCartItem(input: UpdateCartItemInput): Promise<void> {
  const response = await fetch(`/api/cart/${input.itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: input.quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar el carrito');
  }
}

async function removeCartItem(itemId: string): Promise<void> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar del carrito');
  }
}

async function clearCart(): Promise<void> {
  const response = await fetch('/api/cart/clear', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al vaciar el carrito');
  }
}

// React Query Hooks
export function useCartQuery() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated, // Solo si hay sesión
    staleTime: 1000 * 60 * 2, // 2 minutos de stale time
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Producto añadido al carrito');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al añadir al carrito');
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el carrito');
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Producto eliminado del carrito');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar del carrito');
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Carrito vaciado');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al vaciar el carrito');
    },
  });
}

// Default export
export default useCartQuery;
