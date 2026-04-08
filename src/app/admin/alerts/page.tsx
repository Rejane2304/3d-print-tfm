/**
 * Admin Alerts Page
 * Alert and notification management with DataTable component
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bell, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Package,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Wrench,
  CheckSquare,
  Square
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Alert {
  id: string;
  type: string;
  typeTranslated: string;
  severity: string;
  severityTranslated: string;
  status: string;
  statusTranslated: string;
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    minStock: number;
    image?: string;
  };
  resolvedByUser?: {
    name: string;
  };
}

const typeLabels: Record<string, string> = {
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
  PAYMENT_FAILED: 'Pago Fallido',
  ORDER_DELAYED: 'Pedido Retrasado',
  SYSTEM_ERROR: 'Error del Sistema',
  NEW_ORDER: 'Nuevo Pedido',
  NEGATIVE_REVIEW: 'Reseña Negativa',
  HIGH_VALUE_ORDER: 'Pedido Alto Valor',
  NEW_USER: 'Nuevo Usuario',
  COUPON_EXPIRING: 'Cupón por Expirar',
};

const severityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelta',
  IGNORED: 'Ignorada',
};

const typeIcons: Record<string, React.ElementType> = {
  LOW_STOCK: Package,
  OUT_OF_STOCK: XCircle,
  PAYMENT_FAILED: Clock,
  ORDER_DELAYED: AlertTriangle,
  SYSTEM_ERROR: AlertCircle,
  NEW_ORDER: Package,
  NEGATIVE_REVIEW: AlertCircle,
  HIGH_VALUE_ORDER: Package,
  NEW_USER: Bell,
  COUPON_EXPIRING: Clock,
};

const severityColors: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  IGNORED: 'bg-gray-100 text-gray-700',
};

export default function AdminAlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [stats, setStats] = useState({
    pending: 0,
    critical: 0,
    high: 0,
    total: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando alertas');
      }

      setAlerts(data.alertas || []);
      setStats({
        pending: data.pendientes || 0,
        critical: data.critica || 0,
        high: data.alta || 0,
        total: data.total || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, severityFilter, statusFilter]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/alerts');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadAlerts();
    }
  }, [status, session, router, loadAlerts]);

  const updateStatus = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: nuevoEstado,
          resolutionNotes: resolutionNotes || undefined,
        }),
      });

      if (response.ok) {
        await loadAlerts();
        setShowModal(false);
        setResolutionNotes('');
        setSelectedAlert(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Error actualizando');
      }
    } catch {
      setError('Error al actualizar alerta');
    }
  };

  const deleteAlert = (id: string) => {
    setAlertToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;

    try {
      const response = await fetch(`/api/admin/alerts/${alertToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAlerts();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar');
      }
    } catch {
      setError('Error eliminando alerta');
    } finally {
      setDeleteModalOpen(false);
      setAlertToDelete(null);
    }
  };

  const openResolveModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolutionNotes('');
    setShowModal(true);
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} alerta(s)?`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/admin/alerts/${id}`, { method: 'DELETE' })
        )
      );
      await loadAlerts();
    } catch (error) {
      console.error('Error al eliminar alertas:', error);
    }
  };

  const handleBulkResolve = async (selectedIds: string[]) => {
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch('/api/admin/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'RESOLVED' }),
          })
        )
      );
      await loadAlerts();
    } catch (error) {
      console.error('Error resolviendo alertas:', error);
    }
  };

  const handleBulkIgnore = async (selectedIds: string[]) => {
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch('/api/admin/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'IGNORED' }),
          })
        )
      );
      await loadAlerts();
    } catch (error) {
      console.error('Error ignorando alertas:', error);
    }
  };

  const columns: Column<Alert>[] = [
    {
      key: 'type',
      header: 'Tipo',
      sortable: true,
      className: '',
      render: (value: unknown, row) => {
        const typeValue = value as string;
        const TipoIcon = typeIcons[typeValue] || Bell;
        return (
          <div className="flex items-center gap-2">
            <TipoIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{typeLabels[typeValue] || typeValue}</span>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Alerta',
      sortable: true,
      className: '',
      render: (value, row) => (
        <div className="flex items-start gap-3">
          {row.product ? (
            <Link href={`/admin/products/${row.product.slug}/editar`}>
              {row.product.image ? (
                <Image
                  src={row.product.image}
                  alt={row.product.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            {row.product ? (
              <Link
                href={`/admin/products/${row.product.slug}/editar`}
                className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
              >
                {value as string}
              </Link>
            ) : (
              <div className="text-sm font-medium text-gray-900 truncate">{value as string}</div>
            )}
            <div className="text-sm text-gray-500 max-w-xs sm:max-w-md truncate">{row.message}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severidad',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[value as string] || 'bg-gray-100'}`}>
          {severityLabels[value as string] || (value as string)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as string] || 'bg-gray-100'}`}>
          {statusLabels[value as string] || (value as string)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {new Date(value as string).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'PENDING' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(row.id, 'IN_PROGRESS');
                }}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                title="Marcar En Progreso"
              >
                <Clock className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openResolveModal(row);
                }}
                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
                title="Resolver"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(row.id, 'IGNORED');
                }}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                title="Ignorar"
              >
                <Eye className="h-4 w-4" />
              </button>
            </>
          )}
          {row.status === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openResolveModal(row);
              }}
              className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
              title="Resolver"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteAlert(row.id);
            }}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'resolve',
      label: 'Resolver Seleccionadas',
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'primary',
      onClick: handleBulkResolve,
    },
    {
      key: 'ignore',
      label: 'Ignorar Seleccionadas',
      icon: <Eye className="h-4 w-4" />,
      variant: 'secondary',
      onClick: handleBulkIgnore,
    },
    {
      key: 'delete',
      label: 'Eliminar Seleccionadas',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando alertas...</p>
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
              <div className="relative">
                <Bell className="h-8 w-8 text-indigo-600" />
                {stats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {stats.pending > 9 ? '9+' : stats.pending}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
                <p className="text-sm text-gray-500">
                  {stats.pending} pendientes · {stats.critical} críticas · {stats.high} altas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAlerts}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
              <Link
                href="/admin/dashboard"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                &larr; Volver al Panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total de Alertas</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Pendientes</div>
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Críticas</div>
            <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Altas</div>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los Tipos</option>
              <option value="LOW_STOCK">Stock Bajo</option>
              <option value="OUT_OF_STOCK">Sin Stock</option>
              <option value="PAYMENT_FAILED">Pago Fallido</option>
              <option value="ORDER_DELAYED">Pedido Retrasado</option>
              <option value="SYSTEM_ERROR">Error del Sistema</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todas las Severidades</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los Estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="RESOLVED">Resuelta</option>
              <option value="IGNORED">Ignorada</option>
            </select>
          </div>
        </div>

        {/* Alerts DataTable */}
        <DataTable<Alert>
          data={alerts}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={['title', 'message', 'type']}
          searchPlaceholder="Buscar alertas..."
          pagination
          selectable
          bulkActions={bulkActions}
          exportable
          exportFilename="alerts.csv"
          emptyMessage="No hay alertas para mostrar"
          noResultsMessage="Ninguna alerta coincide con tu búsqueda"
        />
      </div>

      {/* Resolution Modal */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Resolver Alerta
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              {selectedAlert.title}
            </p>
            <div className="mb-4">
              <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas de Resolución (opcional)
              </label>
              <textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe cómo se resolvió la alerta..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus(selectedAlert.id, 'RESOLVED')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Marcar como Resuelta
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAlert(null);
                  setResolutionNotes('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAlertToDelete(null);
        }}
        onConfirm={confirmDeleteAlert}
        title="¿Eliminar Alerta?"
        description="Esta acción no se puede deshacer. La alerta será eliminada permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
