/**
 * Página de Gestión de Pedidos - Admin
 * Listado y gestión de pedidos
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  Package,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Box
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  estado: string;
  total: number;
  createdAt: string;
  usuario: {
    nombre: string;
    email: string;
  };
  items: Array<{ id: string }>;
}

const orderStatuses: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
  Confirmado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, label: 'Confirmado' },
  'En preparación': { color: 'bg-indigo-100 text-indigo-800', icon: Box, label: 'En preparación' },
  Enviado: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Enviado' },
  Entregado: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Entregado' },
  Cancelado: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _estadosConfig = orderStatuses;

export default function AdminPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/admin/orders${statusFilter ? `?estado=${statusFilter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedidos');
      }

      setOrders(data.pedidos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/orders');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadOrders();
    }
  }, [status, session, router, loadOrders]);

  const updateStatus = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });

      if (response.ok) {
        await loadOrders();
      }
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
      order.usuario.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de pedido o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmado">Confirmado</option>
                <option value="En preparación">En preparación</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = orderStatuses[order.estado] || { color: 'bg-gray-100 text-gray-800', icon: Package, label: order.estado };
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50" data-testid="order-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-indigo-600">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} productos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.usuario.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusConfig.color}`} data-testid="order-status">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(order.total).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-indigo-600 hover:text-indigo-900 p-2"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {order.estado === 'Confirmado' && (
                            <button
                              onClick={() => updateStatus(order.id, 'En preparación')}
                              className="text-blue-600 hover:text-blue-900 p-2"
                              title="Marcar en preparación"
                            >
                              <Box className="h-4 w-4" />
                            </button>
                          )}
                          {order.estado === 'En preparación' && (
                            <button
                              onClick={() => updateStatus(order.id, 'Enviado')}
                              className="text-purple-600 hover:text-purple-900 p-2"
                              title="Marcar como enviado"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredOrders.length} de {orders.length} pedidos
        </div>
      </div>
    </div>
  );
}
