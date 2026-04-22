/**
 * useOrders Hook
 * Hook para obtener pedidos del usuario con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  producto: {
    nombre: string;
    slug: string;
    images: Array<{ url: string }>;
  };
}

export interface Order {
  id: string;
  numeroPedido: string;
  estado: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  factura?: {
    id: string;
    numeroFactura: string;
    anulada: boolean;
  };
  pago?: {
    estado: string;
    metodo: string;
  };
}

export interface OrderDetail extends Order {
  usuario: {
    nombre: string;
    email: string;
  };
  direccionEnvio?: {
    nombreDireccion: string;
    destinatario: string;
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
    telefono?: string;
  };
  estadoPago: string;
  metodoPago: string;
}

// API Functions
async function fetchOrders(status?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  const url = `/api/account/orders${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar pedidos');
  }

  const data = await response.json();
  return data.pedidos || [];
}

async function fetchOrder(id: string): Promise<OrderDetail> {
  const response = await fetch(`/api/account/orders/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar el pedido');
  }

  const data = await response.json();
  return data.pedido || data;
}

async function cancelOrder(orderId: string): Promise<void> {
  const response = await fetch('/api/orders/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cancelar el pedido');
  }
}

// React Query Hooks
export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => fetchOrders(status),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pedido cancelado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al cancelar el pedido');
    },
  });
}

// Prefetch helpers
export function prefetchOrders(queryClient: ReturnType<typeof useQueryClient>, status?: string) {
  return queryClient.prefetchQuery({
    queryKey: ['orders', status],
    queryFn: () => fetchOrders(status),
  });
}

export function prefetchOrder(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.prefetchQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
  });
}

// Default export
export default useOrders;
