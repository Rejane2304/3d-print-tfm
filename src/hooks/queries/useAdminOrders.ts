/**
 * useAdminOrders Hook
 * Hook para operaciones de pedidos en el panel de admin con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface AdminOrder {
  id: string;
  numeroPedido: string;
  estado: string;
  total: number;
  createdAt: string;
  usuario: {
    nombre: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      slug: string;
    };
  }>;
  pago?: {
    estado: string;
    metodo: string;
  };
}

export interface AdminOrderDetail extends AdminOrder {
  direccionEnvio?: {
    nombreDireccion: string;
    destinatario: string;
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  notas?: string;
  factura?: {
    id: string;
    numeroFactura: string;
  };
}

// API Functions
async function fetchAdminOrders(status?: string): Promise<AdminOrder[]> {
  const params = new URLSearchParams();
  if (status) params.set('estado', status);

  const url = `/api/admin/orders${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar pedidos');
  }

  const data = await response.json();
  return data.pedidos || [];
}

async function fetchAdminOrder(id: string): Promise<AdminOrderDetail> {
  const response = await fetch(`/api/admin/orders/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cargar el pedido');
  }

  const data = await response.json();
  return data.pedido || data;
}

async function updateOrderStatus(id: string, estado: string): Promise<void> {
  const response = await fetch('/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, estado }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar el estado');
  }
}

async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar el pedido');
  }
}

// React Query Hooks
export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => fetchAdminOrders(status),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => fetchAdminOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => updateOrderStatus(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Estado actualizado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el estado');
    },
  });
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Pedido eliminado correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el pedido');
    },
  });
}

// Prefetch helpers
export function prefetchAdminOrders(queryClient: ReturnType<typeof useQueryClient>, status?: string) {
  return queryClient.prefetchQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => fetchAdminOrders(status),
  });
}

// Default export
export default useAdminOrders;
