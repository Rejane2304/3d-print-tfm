/**
 * Admin Orders Page
 * Order listing and management with DataTable component
 */
'use client';

import { showConfirm } from '@/lib/dialogs';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Box, CheckCircle2, Clock, Eye, Loader2, Package, Trash2, Truck, XCircle } from 'lucide-react';
// RealTimeNotifications and DashboardMetricsUpdater removed - unused
import type { BulkAction, Column } from '@/components/ui/DataTable';
import { DataTable } from '@/components/ui/DataTable';

interface Order {
  id: string;
  numeroPedido: string;
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
  Pendiente: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Pendiente',
  },
  Confirmado: {
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    label: 'Confirmado',
  },
  'En preparación': {
    color: 'bg-indigo-100 text-indigo-800',
    icon: Box,
    label: 'En preparación',
  },
  Enviado: {
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
    label: 'Enviado',
  },
  Entregado: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    label: 'Entregado',
  },
  Cancelado: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Cancelado',
  },
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = statusFilter ? `?estado=${statusFilter}` : '';
      const url = `/api/admin/orders${queryParams}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedidos');
      }

      setOrders(data.pedidos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
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

  const handleDeleteOrders = async (selectedIds: string[]) => {
    if (!showConfirm(`¿Estás seguro de que deseas eliminar ${selectedIds.length} pedido(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })));
      await loadOrders();
    } catch (error) {
      console.error('Error al eliminar pedidos:', error);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'numeroPedido',
      header: 'Nº Pedido',
      sortable: true,
      className: 'font-medium text-gray-900',
      render: value => <span className="text-sm font-mono font-semibold text-indigo-600">{value as string}</span>,
    },
    {
      key: 'usuario',
      header: 'Cliente',
      className: '',
      render: value => {
        const user = value as { nombre: string; email: string };
        return (
          <div>
            <div className="text-sm font-medium text-gray-900 truncate">{user.nombre}</div>
            <div className="text-sm text-gray-500 hidden sm:block">{user.email}</div>
          </div>
        );
      },
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      className: '',
      render: value => <span className="text-sm text-gray-900 font-medium">{Number(value).toFixed(2)} €</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      className: '',
      render: value => {
        const statusConfig = orderStatuses[value as string] || {
          color: 'bg-gray-100 text-gray-800',
          icon: Package,
          label: value as string,
        };
        const StatusIcon = statusConfig.icon;
        return (
          <span
            className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusConfig.color}`}
          >
            <StatusIcon className="h-3 w-3" />
            <span className="hidden sm:inline">{statusConfig.label}</span>
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: value => (
        <span className="text-sm text-gray-500">{new Date(value as string).toLocaleDateString('es-ES')}</span>
      ),
    },
    {
      key: 'items',
      header: 'Productos',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (_, row) => <span className="text-sm text-gray-600">{row.items.length}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/orders/${row.id}`}
            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {row.estado === 'Confirmado' && (
            <button
              onClick={e => {
                e.stopPropagation();
                updateStatus(row.id, 'En preparación');
              }}
              className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50"
              title="Marcar como En preparación"
            >
              <Box className="h-4 w-4" />
            </button>
          )}
          {row.estado === 'En preparación' && (
            <button
              onClick={e => {
                e.stopPropagation();
                updateStatus(row.id, 'Enviado');
              }}
              className="text-purple-600 hover:text-purple-900 p-1.5 rounded hover:bg-purple-50"
              title="Marcar como Enviado"
            >
              <Truck className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Eliminar seleccionados',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handleDeleteOrders,
    },
  ];

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
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
            </div>
            <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
              &larr; Volver al Panel
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
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

        {/* Orders DataTable */}
        <DataTable<Order>
          data={orders}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={['numeroPedido', 'usuario.nombre', 'usuario.email']}
          searchPlaceholder="Buscar por número de pedido o cliente..."
          pagination
          selectable
          bulkActions={bulkActions}
          exportable
          exportFilename="orders.csv"
          emptyMessage="No se encontraron pedidos"
          noResultsMessage="Ningún pedido coincide con tu búsqueda"
        />
      </div>
    </div>
  );
}
