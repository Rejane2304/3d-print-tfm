/**
 * Cart API Service
 * Servicios para gestión del carrito de compras
 * @module lib/api/services/cart-api
 */

import { apiClient } from '@/lib/api/client';
import type { AddToCartRequest, ApiResponse, CartResponse, UpdateCartItemRequest } from '@/types/api';

/**
 * Errores específicos del dominio del carrito
 */
export class CartError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_STOCK' | 'PRODUCT_NOT_FOUND' | 'CART_EMPTY' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'CartError';
  }
}

/**
 * Obtiene el carrito del usuario autenticado
 * @returns Datos del carrito
 * @throws {CartError} Si hay error al cargar el carrito
 */
export async function getCart(): Promise<CartResponse> {
  try {
    const response = await apiClient.get<ApiResponse<CartResponse>>('/api/cart');

    if (!response.success) {
      throw new CartError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof CartError) throw error;
    throw new CartError(error instanceof Error ? error.message : 'Error al cargar el carrito', 'UNKNOWN');
  }
}

/**
 * Agrega un producto al carrito
 * @param productId - ID del producto a agregar
 * @param quantity - Cantidad a agregar
 * @returns Mensaje de éxito
 * @throws {CartError} Si no hay stock suficiente o el producto no existe
 */
export async function addToCart(productId: string, quantity: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/cart', {
      productId,
      quantity,
    } as AddToCartRequest);

    if (!response.success) {
      // Detectar error de stock insuficiente
      if (response.error.toLowerCase().includes('stock')) {
        throw new CartError(response.error, 'INSUFFICIENT_STOCK');
      }
      throw new CartError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Producto agregado al carrito',
    };
  } catch (error) {
    if (error instanceof CartError) throw error;
    throw new CartError(error instanceof Error ? error.message : 'Error al agregar al carrito', 'UNKNOWN');
  }
}

/**
 * Actualiza la cantidad de un item en el carrito
 * @param itemId - ID del item del carrito
 * @param quantity - Nueva cantidad (0 para eliminar)
 * @returns Mensaje de éxito
 * @throws {CartError} Si no hay stock suficiente
 */
export async function updateCartItem(itemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.patch<ApiResponse<unknown>>(`/api/cart/${itemId}`, {
      quantity,
    } as UpdateCartItemRequest);

    if (!response.success) {
      if (response.error.toLowerCase().includes('stock')) {
        throw new CartError(response.error, 'INSUFFICIENT_STOCK');
      }
      throw new CartError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Cantidad actualizada',
    };
  } catch (error) {
    if (error instanceof CartError) throw error;
    throw new CartError(error instanceof Error ? error.message : 'Error al actualizar el item', 'UNKNOWN');
  }
}

/**
 * Elimina un item del carrito
 * @param itemId - ID del item a eliminar
 * @returns Mensaje de éxito
 */
export async function removeFromCart(itemId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.delete<ApiResponse<unknown>>(`/api/cart/${itemId}`);

    if (!response.success) {
      throw new CartError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Item eliminado',
    };
  } catch (error) {
    throw new CartError(error instanceof Error ? error.message : 'Error al eliminar el item', 'UNKNOWN');
  }
}

/**
 * Vacía el carrito del usuario autenticado
 * @returns Mensaje de éxito
 */
export async function clearCart(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/cart/clear', {});

    if (!response.success) {
      throw new CartError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Carrito vaciado',
    };
  } catch (error) {
    throw new CartError(error instanceof Error ? error.message : 'Error al vaciar el carrito', 'UNKNOWN');
  }
}

/**
 * Restaura el carrito desde un pedido anterior
 * @param orderId - ID del pedido a restaurar
 * @returns Mensaje de éxito
 * @throws {CartError} Si el pedido no existe o no se puede restaurar
 */
export async function restoreCartFromOrder(
  orderId: string,
): Promise<{ success: boolean; message: string; itemsAdded?: number }> {
  try {
    const response = await apiClient.post<ApiResponse<{ itemsAdded: number }>>('/api/cart/restore-from-order', {
      orderId,
    });

    if (!response.success) {
      throw new CartError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Carrito restaurado',
      itemsAdded: response.data?.itemsAdded,
    };
  } catch (error) {
    throw new CartError(error instanceof Error ? error.message : 'Error al restaurar el carrito', 'UNKNOWN');
  }
}

/**
 * Migra el carrito del localStorage a la API (después del login)
 * @param items - Items del carrito local
 * @returns Resultado de la migración
 */
export async function migrateLocalCart(items: Array<{ productId: string; quantity: number }>): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await addToCart(item.productId, item.quantity);
      migrated++;
    } catch (error) {
      failed++;
      errors.push(error instanceof Error ? error.message : `Error con producto ${item.productId}`);
    }
  }

  return {
    success: failed === 0,
    migrated,
    failed,
    errors,
  };
}

/**
 * Verifica si un error es de tipo CartError
 */
export function isCartError(error: unknown): error is CartError {
  return error instanceof CartError;
}

/**
 * Obtiene un mensaje de error amigable para el carrito
 */
export function getCartErrorMessage(error: unknown): string {
  if (isCartError(error)) {
    switch (error.code) {
      case 'INSUFFICIENT_STOCK':
        return 'No hay suficiente stock disponible para este producto.';
      case 'PRODUCT_NOT_FOUND':
        return 'El producto no existe o ya no está disponible.';
      case 'CART_EMPTY':
        return 'Tu carrito está vacío.';
      default:
        return error.message || 'Ha ocurrido un error con tu carrito.';
    }
  }
  return 'Ha ocurrido un error inesperado.';
}
