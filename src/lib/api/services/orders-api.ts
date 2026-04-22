/**
 * Orders API Service
 * Servicios para gestión de pedidos del usuario
 * @module lib/api/services/orders-api
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse, OrderDetailResponse, OrderResponse, OrdersListResponse } from '@/types/api';

/**
 * Errores específicos del dominio de pedidos
 */
export class OrdersError extends Error {
  constructor(
    message: string,
    public code: 'ORDER_NOT_FOUND' | 'UNAUTHORIZED' | 'CANCEL_NOT_ALLOWED' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'OrdersError';
  }
}

/**
 * Obtiene todos los pedidos del usuario autenticado
 * @returns Lista de pedidos
 * @throws {OrdersError} Si hay error al obtener los pedidos
 */
export async function getOrders(): Promise<OrderResponse[]> {
  try {
    const response = await apiClient.get<ApiResponse<OrdersListResponse>>('/api/account/orders');

    if (!response.success) {
      if (response.error?.toLowerCase().includes('autenticado')) {
        throw new OrdersError(response.error, 'UNAUTHORIZED');
      }
      throw new OrdersError(response.error, 'UNKNOWN');
    }

    return response.data.pedidos;
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al cargar pedidos', 'UNKNOWN');
  }
}

/**
 * Obtiene un pedido específico del usuario
 * @param orderId - ID del pedido
 * @returns Detalles completos del pedido
 * @throws {OrdersError} Si el pedido no existe o no pertenece al usuario
 */
export async function getOrder(orderId: string): Promise<OrderDetailResponse> {
  try {
    const response = await apiClient.get<ApiResponse<OrderDetailResponse>>(`/api/account/orders/${orderId}`);

    if (!response.success) {
      if (response.error?.toLowerCase().includes('autenticado')) {
        throw new OrdersError(response.error, 'UNAUTHORIZED');
      }
      throw new OrdersError(response.error, 'ORDER_NOT_FOUND');
    }

    return response.data;
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al cargar el pedido', 'UNKNOWN');
  }
}

/**
 * Obtiene un pedido por su número de pedido
 * @param orderNumber - Número del pedido (ej: P-2024122501-001)
 * @returns Detalles del pedido
 * @throws {OrdersError} Si el pedido no existe
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderDetailResponse | null> {
  try {
    const orders = await getOrders();
    const order = orders.find(o => o.numeroPedido === orderNumber);

    if (!order) {
      return null;
    }

    return await getOrder(order.id);
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al buscar el pedido', 'UNKNOWN');
  }
}

/**
 * Cancela un pedido pendiente
 * @param orderId - ID del pedido a cancelar
 * @returns Mensaje de éxito
 * @throws {OrdersError} Si el pedido no puede ser cancelado
 */
export async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/orders/cancel', {
      orderId,
    });

    if (!response.success) {
      if (response.error?.toLowerCase().includes('no se puede cancelar')) {
        throw new OrdersError(response.error, 'CANCEL_NOT_ALLOWED');
      }
      throw new OrdersError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Pedido cancelado correctamente',
    };
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al cancelar el pedido', 'UNKNOWN');
  }
}

/**
 * Cancela un pedido y restaura el stock
 * @param orderId - ID del pedido a cancelar
 * @returns Mensaje de éxito con información del stock restaurado
 * @throws {OrdersError} Si el pedido no puede ser cancelado
 */
export async function cancelOrderAndRestoreStock(
  orderId: string,
): Promise<{ success: boolean; message: string; itemsRestored?: number }> {
  try {
    const response = await apiClient.post<ApiResponse<{ itemsRestored: number }>>('/api/orders/cancel-and-restore', {
      orderId,
    });

    if (!response.success) {
      throw new OrdersError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      message: response.message ?? 'Pedido cancelado y stock restaurado',
      itemsRestored: response.data?.itemsRestored,
    };
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al cancelar el pedido', 'UNKNOWN');
  }
}

/**
 * Crea una solicitud de devolución para un pedido
 * @param orderId - ID del pedido
 * @param reason - Motivo de la devolución
 * @param items - Items a devolver con cantidades
 * @returns Información de la devolución creada
 * @throws {OrdersError} Si el pedido no es elegible para devolución
 */
export async function createReturnRequest(
  orderId: string,
  reason: string,
  items: Array<{ orderItemId: string; quantity: number; reason?: string }>,
): Promise<{
  success: boolean;
  returnId?: string;
  message: string;
}> {
  try {
    const response = await apiClient.post<ApiResponse<{ returnId: string }>>('/api/returns', {
      orderId,
      reason,
      items: items.map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason ?? reason,
      })),
    });

    if (!response.success) {
      throw new OrdersError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      returnId: response.data?.returnId,
      message: response.message ?? 'Solicitud de devolución creada',
    };
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al crear la devolución', 'UNKNOWN');
  }
}

/**
 * Descarga la factura de un pedido
 * @param invoiceId - ID de la factura
 * @returns URL de descarga o datos de la factura
 * @throws {OrdersError} Si la factura no existe
 */
export async function downloadInvoice(invoiceId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Nota: Este endpoint debe ser implementado en el backend
    const response = await apiClient.get<ApiResponse<{ url: string }>>(`/api/account/invoices/${invoiceId}/download`);

    if (!response.success) {
      throw new OrdersError(response.error, 'UNKNOWN');
    }

    return {
      success: true,
      url: response.data?.url,
    };
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError(error instanceof Error ? error.message : 'Error al descargar la factura', 'UNKNOWN');
  }
}

/**
 * Filtra pedidos por estado
 * @param status - Estado del pedido
 * @returns Lista de pedidos filtrados
 */
export async function getOrdersByStatus(status: OrderResponse['estado']): Promise<OrderResponse[]> {
  const orders = await getOrders();
  return orders.filter(order => order.estado === status);
}

/**
 * Obtiene los pedidos recientes del usuario
 * @param limit - Cantidad de pedidos a obtener
 * @returns Lista de pedidos recientes
 */
export async function getRecentOrders(limit: number = 5): Promise<OrderResponse[]> {
  const orders = await getOrders();
  return orders.slice(0, limit);
}

/**
 * Obtiene el total de pedidos y gastos del usuario
 * @returns Estadísticas de pedidos
 */
export async function getOrdersStats(): Promise<{
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}> {
  const orders = await getOrders();

  return {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: orders.filter(o =>
      ['Pendiente', 'Pendiente de Pago', 'Pago Confirmado', 'En Preparación'].includes(o.estado),
    ).length,
    completedOrders: orders.filter(o => o.estado === 'Entregado').length,
  };
}

/**
 * Verifica si un pedido puede ser cancelado
 * @param order - Pedido a verificar
 * @returns true si puede cancelarse
 */
export function canCancelOrder(order: OrderResponse): boolean {
  const cancellableStatuses = ['Pendiente', 'Pendiente de Pago', 'Pago Confirmado'];
  return cancellableStatuses.includes(order.estado);
}

/**
 * Verifica si un pedido puede ser devuelto
 * @param order - Pedido a verificar
 * @returns true si puede devolverse
 */
export function canReturnOrder(order: OrderResponse): boolean {
  return order.estado === 'Entregado';
}

/**
 * Verifica si un error es de tipo OrdersError
 */
export function isOrdersError(error: unknown): error is OrdersError {
  return error instanceof OrdersError;
}

/**
 * Obtiene un mensaje de error amigable para pedidos
 */
export function getOrdersErrorMessage(error: unknown): string {
  if (isOrdersError(error)) {
    switch (error.code) {
      case 'ORDER_NOT_FOUND':
        return 'El pedido que buscas no existe o no tienes acceso a él.';
      case 'UNAUTHORIZED':
        return 'Debes iniciar sesión para ver tus pedidos.';
      case 'CANCEL_NOT_ALLOWED':
        return 'Este pedido no puede ser cancelado en su estado actual.';
      default:
        return error.message || 'Ha ocurrido un error al procesar tu solicitud.';
    }
  }
  return 'Ha ocurrido un error inesperado.';
}
