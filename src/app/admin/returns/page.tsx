/**
 * Admin Returns Page
 * Returns listing and management for administrators
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialogProvider, showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, Eye, Loader2, Package, RotateCcw, Upload, XCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useAdminRealTime, useNotificationToast } from '@/hooks/useRealTime';
import { Toaster } from '@/components/ui/Toaster';
import { CSVUpload } from '@/components/admin/CSVUpload';

interface ReturnItem {
  id: string;
  producto: {
    nombre: string;
  };
  cantidad: number;
  precioUnitario: number;
}

interface Return {
  id: string;
  orderId: string;
  numeroPedido: string;
  estado: string;
  motivo: string;
  cantidadTotal: number;
  notasAdmin?: string | null;
  procesadoEn?: string | null;
  fechaEntregaPedido?: string | null;
  createdAt: string;
  updatedAt: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  items: ReturnItem[];
}

const returnStatuses: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Pendiente: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Pendiente',
  },
  Aprobada: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    label: 'Aprobada',
  },
  Rechazada: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Rechazada',
  },
  Completada: {
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    label: 'Completada',
  },
};

export default function AdminReturnsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Real-time setup
  const { pendingEvents, acknowledgeEvents, isConnected } = useAdminRealTime();
  const { notifications, showNotification, removeNotification } = useNotificationToast();

  // Listen for real-time events
  useEffect(() => {
    if (pendingEvents.length > 0) {
      pendingEvents.forEach(event => {
        // Show notification for return status updates and new returns
        if (event.type === 'return:status:updated' || event.type === 'return:new') {
          showNotification(event);
          // Refresh returns data
          loadReturns();
        }
      });
      // Acknowledge events
      acknowledgeEvents(pendingEvents.map(e => e.timestamp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvents]);

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = statusFilter ? `?status=${statusFilter}` : '';
      const response = await fetch(`/api/admin/returns${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar devoluciones');
      }

      setReturns(data.devoluciones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/returns');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadReturns();
    }
  }, [status, session, router, loadReturns]);

  const updateReturnStatus = async (id: string, nuevoEstado: string, notasAdmin?: string) => {
    try {
      const response = await fetch(`/api/admin/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, notasAdmin }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadReturns();
        await showConfirmDialog({
          title: 'Éxito',
          message: data.mensaje || 'Devolución actualizada correctamente',
          confirmText: 'Aceptar',
          cancelText: '',
          variant: 'info',
        });
      } else {
        throw new Error(data.error || 'Error al actualizar devolución');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleApprove = async (returnId: string) => {
    const confirmed = await showConfirmDialog({
      title: 'Aprobar devolución',
      message:
        '¿Estás seguro de que deseas aprobar esta devolución? Se restaurará el stock y se iniciará el reembolso.',
      confirmText: 'Sí, aprobar',
      cancelText: 'Cancelar',
      variant: 'primary',
    });

    if (confirmed) {
      await updateReturnStatus(returnId, 'Aprobada');
    }
  };

  const handleReject = async (returnId: string) => {
    const reason = await showConfirmDialog({
      title: 'Rechazar devolución',
      message: '¿Estás seguro de que deseas rechazar esta devolución? Incluye el motivo:',
      confirmText: 'Sí, rechazar',
      cancelText: 'Cancelar',
      variant: 'danger',
      inputPlaceholder: 'Motivo del rechazo',
    });

    if (typeof reason === 'string' && reason) {
      await updateReturnStatus(returnId, 'Rechazada', reason);
    }
  };

  const columns: Column<Return>[] = [
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
      key: 'cantidadTotal',
      header: 'Importe',
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
        const statusConfig = returnStatuses[value as string] || {
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
      header: 'Solicitada',
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
            href={`/admin/returns/${row.id}`}
            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {row.estado === 'Pendiente' && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleApprove(row.id);
                }}
                className="text-green-600 hover:text-green-900 p-1.5 rounded hover:bg-green-50"
                title="Aprobar devolución"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleReject(row.id);
                }}
                className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50"
                title="Rechazar devolución"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando devoluciones...</p>
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
              <RotateCcw className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                &larr; Volver al Panel
              </Link>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Importar CSV
              </button>
            </div>
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
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Returns DataTable */}
        <DataTable<Return>
          data={returns}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={['numeroPedido', 'usuario.nombre', 'usuario.email', 'motivo']}
          searchPlaceholder="Buscar por pedido, cliente o motivo..."
          pagination
          exportable
          exportFilename="returns.csv"
          emptyMessage="No se encontraron devoluciones"
          noResultsMessage="Ninguna devolución coincide con tu búsqueda"
        />
      </div>
      <ConfirmDialogProvider />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Importar Devoluciones</h2>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CSVUpload
                title="Devoluciones"
                description="Importa solicitudes de devolución desde un archivo CSV. Cada fila representa una devolución de pedido."
                requiredColumns={['orderId', 'userEmail', 'reason', 'items']}
                optionalColumns={['status', 'adminNotes']}
                apiEndpoint="/api/admin/returns/import"
                sampleCSV={`orderId,userEmail,reason,items,status,adminNotes
"ORD-2024-001","cliente@email.com","Producto defectuoso","[{\"productId\":\"prod-uuid-1\",\"quantity\":1,\"reason\":\"Defecto\"}]","PENDING",""
"ORD-2024-002","usuario@email.com","No coincide con la descripción","[{\"productId\":\"prod-uuid-2\",\"quantity\":2}]","PENDING",""
"ORD-2024-003","test@email.com","Cambio de opinión","[{\"productId\":\"prod-uuid-3\",\"quantity\":1}]","APPROVED","Aprobado por política de 14 días"`}
                onSuccess={() => {
                  loadReturns();
                  setShowImportModal(false);
                }}
                options={{
                  skipDuplicates: true,
                  createMissingUsers: true,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Notifications */}
      <Toaster notifications={notifications} onDismiss={removeNotification} />
      {isConnected && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Tiempo real conectado
          </div>
        </div>
      )}
    </div>
  );
}
