/**
 * Página de Gestión de Alertas - Admin
 * System for alertas y notificaciones - MEJORADO
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
  Eye,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Wrench,
  CheckSquare,
  Square
} from 'lucide-react';
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
};

const severityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Proceso',
  RESOLVED: 'Resuelta',
  IGNORED: 'Ignorada',
};

const typeIcons: Record<string, React.ElementType> = {
  LOW_STOCK: Package,
  OUT_OF_STOCK: XCircle,
  PAYMENT_FAILED: Clock,
  ORDER_DELAYED: AlertTriangle,
  SYSTEM_ERROR: AlertCircle,
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

export default function AdminAlertasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({
    pendientes: 0,
    critica: 0,
    alta: 0,
    total: 0,
  });
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'RESOLVED' | 'IGNORED' | 'DELETE' | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar alertas');
      }

      setAlerts(data.alertas || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setStats({
        pendientes: data.pendientes || 0,
        critica: data.critica || 0,
        alta: data.alta || 0,
        total: data.total || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, severityFilter, statusFilter, searchQuery, page, limit]);

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

  const toggleSelectAlert = (id: string) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.id));
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedAlerts.length === 0) return;

    try {
      if (bulkAction === 'DELETE') {
        await Promise.all(selectedAlerts.map(id => 
          fetch(`/api/admin/alerts/${id}`, { method: 'DELETE' })
        ));
      } else {
        await Promise.all(selectedAlerts.map(id => 
          fetch('/api/admin/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: bulkAction }),
          })
        ));
      }
      await loadAlerts();
      setSelectedAlerts([]);
    } catch {
      setError('Error al ejecutar acción masiva');
    } finally {
      setBulkActionModalOpen(false);
      setBulkAction(null);
    }
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
                {stats.pendientes > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {stats.pendientes > 9 ? '9+' : stats.pendientes}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
                <p className="text-sm text-gray-500">
                  {stats.pendientes} pendientes · {stats.critica} críticas · {stats.alta} altas
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
                ← Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Alertas</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Pendientes</div>
            <div className="text-2xl font-bold text-red-600">{stats.pendientes}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Críticas</div>
            <div className="text-2xl font-bold text-red-700">{stats.critica}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Altas</div>
            <div className="text-2xl font-bold text-orange-600">{stats.alta}</div>
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
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar alertas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los tipos</option>
                <option value="LOW_STOCK">Stock Bajo</option>
                <option value="OUT_OF_STOCK">Stock Agotado</option>
                <option value="PAYMENT_FAILED">Pago Fallido</option>
                <option value="ORDER_DELAYED">Pedido Atrasado</option>
                <option value="SYSTEM_ERROR">Error Sistema</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las severidades</option>
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
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="IN_PROGRESS">En Proceso</option>
                <option value="RESOLVED">Resueltas</option>
                <option value="IGNORED">Ignoradas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAlerts.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-indigo-900 font-medium">
              {selectedAlerts.length} alertas seleccionadas
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setBulkAction('RESOLVED'); setBulkActionModalOpen(true); }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Resolver
              </button>
              <button
                onClick={() => { setBulkAction('IGNORED'); setBulkActionModalOpen(true); }}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Ignorar
              </button>
              <button
                onClick={() => { setBulkAction('DELETE'); setBulkActionModalOpen(true); }}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas que mostrar</p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                >
                  {selectedAlerts.length === alerts.length ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {selectedAlerts.length === alerts.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </span>
                </button>
              </div>

              {/* Alert Items */}
              {alerts.map((alert) => {
                const TipoIcon = typeIcons[alert.type] || Bell;
                const isSelected = selectedAlerts.includes(alert.id);
                
                return (
                  <div 
                    key={alert.id} 
                    className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 
                      alert.status === 'PENDING' ? severityColors[alert.severity] || 'border-gray-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelectAlert(alert.id)}
                        className="mt-1 text-gray-400 hover:text-indigo-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <TipoIcon className="h-6 w-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {alert.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[alert.status] || 'bg-gray-100'}`}>
                                {statusLabels[alert.status] || alert.status}
                              </span>
                            </div>
                            <p className="text-gray-600">{alert.message}</p>
                            
                            {alert.product && (
                              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {alert.product.image ? (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                    <img 
                                      src={alert.product.image} 
                                      alt={alert.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/admin/products/${alert.product.slug}/editar`}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium block truncate"
                                  >
                                    {alert.product.name}
                                  </Link>
                                  <span className="text-gray-500 text-sm">
                                    Stock: {alert.product.stock} / Mín: {alert.product.minStock}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                {new Date(alert.createdAt).toLocaleDateString('es-ES')}
                              </span>
                              {alert.resolvedByUser && (
                                <span className="text-green-600">
                                  Resuelta por: {alert.resolvedByUser.name}
                                </span>
                              )}
                              {alert.resolutionNotes && (
                                <span className="italic text-gray-400">
                                  "{alert.resolutionNotes}"
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {alert.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => updateStatus(alert.id, 'IN_PROGRESS')}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title="Marcar en proceso"
                                >
                                  <Clock className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => openResolveModal(alert)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                  title="Resolver"
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => updateStatus(alert.id, 'IGNORED')}
                                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                  title="Ignorar"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {alert.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => openResolveModal(alert)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                title="Resolver"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                  <span className="text-sm text-gray-500">
                    Mostrando {alerts.length} de {total} alertas
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {page} de {pages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Resolución */}
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

      {/* Modal Acción Masiva */}
      {bulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {bulkAction === 'DELETE' ? 'Eliminar Alertas' : 
               bulkAction === 'RESOLVED' ? 'Resolver Alertas' : 'Ignorar Alertas'}
            </h2>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres {bulkAction === 'DELETE' ? 'eliminar' : 
               bulkAction === 'RESOLVED' ? 'marcar como resueltas' : 'marcar como ignoradas'} {selectedAlerts.length} alertas?
            </p>
            <div className="flex gap-3">
              <button
                onClick={executeBulkAction}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  bulkAction === 'DELETE' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  bulkAction === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setBulkActionModalOpen(false);
                  setBulkAction(null);
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
