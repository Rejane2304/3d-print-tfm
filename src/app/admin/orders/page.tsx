/**
 * Página de Gestión de Pedidos - Admin
 * Listado y gestión de pedidos
 */
'use client';

import { useEffect, useState } from 'react';
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

interface Pedido {
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

const estadosPedido: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDIENTE: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
  PAGADO: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, label: 'Pagado' },
  EN_PREPARACION: { color: 'bg-indigo-100 text-indigo-800', icon: Box, label: 'En preparación' },
  ENVIADO: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Enviado' },
  ENTREGADO: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Entregado' },
  CANCELADO: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' },
};

export default function AdminPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

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
      cargarPedidos();
    }
  }, [status, session, router, filtroEstado]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/admin/orders${filtroEstado ? `?estado=${filtroEstado}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedidos');
      }

      setPedidos(data.pedidos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });

      if (response.ok) {
        await cargarPedidos();
      }
    } catch (err) {
      setError('Error al actualizar estado');
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.orderNumber.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.usuario.email.toLowerCase().includes(busqueda.toLowerCase());
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
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PAGADO">Pagado</option>
                <option value="EN_PREPARACION">En preparación</option>
                <option value="ENVIADO">Enviado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
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
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((pedido) => {
                  const estadoConfig = estadosPedido[pedido.estado] || { color: 'bg-gray-100 text-gray-800', icon: Package, label: pedido.estado };
                  const EstadoIcon = estadoConfig.icon;
                  
                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-indigo-600">
                          {pedido.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pedido.items.length} productos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pedido.usuario.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pedido.usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${estadoConfig.color}`}>
                          <EstadoIcon className="h-3 w-3" />
                          {estadoConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(pedido.total).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pedido.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${pedido.id}`}
                            className="text-indigo-600 hover:text-indigo-900 p-2"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {pedido.estado === 'PAGADO' && (
                            <button
                              onClick={() => actualizarEstado(pedido.id, 'EN_PREPARACION')}
                              className="text-blue-600 hover:text-blue-900 p-2"
                              title="Marcar en preparación"
                            >
                              <Box className="h-4 w-4" />
                            </button>
                          )}
                          {pedido.estado === 'EN_PREPARACION' && (
                            <button
                              onClick={() => actualizarEstado(pedido.id, 'ENVIADO')}
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
          Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
        </div>
      </div>
    </div>
  );
}
