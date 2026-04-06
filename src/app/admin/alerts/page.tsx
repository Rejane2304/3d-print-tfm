/**
 * Página de Gestión de Alertas - Admin
 * System for alertas y notificaciones
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  XCircle,
  Loader2,
  Package,
  Clock,
  Trash2,
  Eye
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Alert {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  mensaje: string;
  estado: string;
  createdAt: string;
  resueltaEn?: string;
  notasResolucion?: string;
  producto?: {
    id: string;
    nombre: string;
    slug: string;
    stock: number;
  };
  resueltaPorUsuario?: {
    nombre: string;
  };
}

const typeIcons: Record<string, React.ElementType> = {
  STOCK_BAJO: Package,
  STOCK_AGOTADO: XCircle,
  PEDIDO_SIN_PAGAR: Clock,
  PEDIDO_ATRASADO: AlertTriangle,
  ERROR_SISTEMA: AlertCircle,
};

const severityColors: Record<string, string> = {
  BAJA: 'bg-blue-100 text-blue-800 border-blue-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICA: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminAlertasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDIENTE');
  const [pendingCount, setPendingCount] = useState(0);
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
      if (typeFilter) params.append('tipo', typeFilter);
      if (severityFilter) params.append('severidad', severityFilter);
      if (statusFilter) params.append('estado', statusFilter);

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar alertas');
      }

      setAlerts(data.alertas || []);
      setPendingCount(data.pendientes || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
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
          estado: nuevoEstado,
          notasResolucion: resolutionNotes || undefined,
        }),
      });

      if (response.ok) {
        await loadAlerts();
        setShowModal(false);
        setResolutionNotes('');
        setSelectedAlert(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al actualizar');
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
      setError('Error al eliminar alerta');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-8 w-8 text-indigo-600" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
                <p className="text-sm text-gray-500">
                  {pendingCount} alertas pendientes
                </p>
              </div>
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
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los tipos</option>
                <option value="STOCK_BAJO">Stock Bajo</option>
                <option value="STOCK_AGOTADO">Stock Agotado</option>
                <option value="PEDIDO_SIN_PAGAR">Pedido sin Pagar</option>
                <option value="PEDIDO_ATRASADO">Pedido Atrasado</option>
                <option value="ERROR_SISTEMA">Error de Sistema</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las severidades</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="RESUELTA">Resueltas</option>
                <option value="IGNORADA">Ignoradas</option>
              </select>
            </div>
            <button
              onClick={loadAlerts}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas que mostrar</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const TipoIcon = typeIcons[alert.tipo] || Bell;
              
              return (
                <div 
                  key={alert.id} 
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                    alert.estado === 'PENDIENTE' ? severityColors[alert.severidad] || 'border-gray-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <TipoIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.titulo}
                        </h3>
                        <p className="text-gray-600 mt-1">{alert.mensaje}</p>
                        
                        {alert.producto && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4" />
                            <Link 
                              href={`/admin/products/${alert.producto.slug}/editar`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {alert.producto.nombre} (Stock: {alert.producto.stock})
                            </Link>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {new Date(alert.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          {alert.resueltaPorUsuario && (
                            <span>
                              Resuelta por: {alert.resueltaPorUsuario.nombre}
                            </span>
                          )}
                          {alert.notasResolucion && (
                             <span className="italic">
                              &quot;{alert.notasResolucion}&quot;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alert.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => updateStatus(alert.id, 'EN_PROCESO')}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="Marcar en proceso"
                          >
                            <Clock className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openResolveModal(alert)}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Resolver"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateStatus(alert.id, 'IGNORADA')}
                            className="text-gray-600 hover:text-gray-800 p-2"
                            title="Ignorar"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {alert.estado === 'EN_PROCESO' && (
                        <button
                          onClick={() => openResolveModal(alert)}
                          className="text-green-600 hover:text-green-800 p-2"
                          title="Resolver"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Resolución */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resolver Alerta
            </h2>
            <p className="text-gray-600 mb-4">
              {selectedAlert.titulo}
            </p>
            <div className="mb-4">
              <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas de resolución (opcional)
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
                onClick={() => updateStatus(selectedAlert.id, 'RESUELTA')}
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

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAlertToDelete(null);
        }}
        onConfirm={confirmDeleteAlert}
        title="¿Eliminar alerta?"
        description="Esta acción no se puede deshacer. La alerta se eliminará permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
