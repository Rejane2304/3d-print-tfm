/**
 * Página de Gestión de Alertas - Admin
 * System for alertas y notificaciones
 */
'use client';

import { useEffect, useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Alerta {
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

const tipoIconos: Record<string, React.ElementType> = {
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

const estadoIconos: Record<string, React.ElementType> = {
  PENDIENTE: Bell,
  EN_PROCESO: Clock,
  RESUELTA: CheckCircle2,
  IGNORADA: Eye,
};

export default function AdminAlertasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [pendientes, setPendientes] = useState(0);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [notasResolucion, setNotasResolucion] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [alertaAEliminar, setAlertaAEliminar] = useState<string | null>(null);

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
      cargarAlertas();
    }
  }, [status, session, router]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroSeveridad) params.append('severidad', filtroSeveridad);
      if (filtroEstado) params.append('estado', filtroEstado);

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar alertas');
      }

      setAlertas(data.alertas || []);
      setPendientes(data.pendientes || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          estado: nuevoEstado,
          notasResolucion: notasResolucion || undefined,
        }),
      });

      if (response.ok) {
        await cargarAlertas();
        setMostrarModal(false);
        setNotasResolucion('');
        setAlertaSeleccionada(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error al actualizar alerta');
    }
  };

  const eliminarAlerta = (id: string) => {
    setAlertaAEliminar(id);
    setModalEliminarOpen(true);
  };

  const confirmarEliminarAlerta = async () => {
    if (!alertaAEliminar) return;

    try {
      const response = await fetch(`/api/admin/alerts/${alertaAEliminar}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await cargarAlertas();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar alerta');
    } finally {
      setModalEliminarOpen(false);
      setAlertaAEliminar(null);
    }
  };

  const abrirModalResolver = (alerta: Alerta) => {
    setAlertaSeleccionada(alerta);
    setNotasResolucion('');
    setMostrarModal(true);
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
                {pendientes > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendientes}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
                <p className="text-sm text-gray-500">
                  {pendientes} alertas pendientes
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
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
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
                value={filtroSeveridad}
                onChange={(e) => setFiltroSeveridad(e.target.value)}
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
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
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
              onClick={cargarAlertas}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alertas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas que mostrar</p>
            </div>
          ) : (
            alertas.map((alerta) => {
              const TipoIcon = tipoIconos[alerta.tipo] || Bell;
              const EstadoIcon = estadoIconos[alerta.estado] || Bell;
              
              return (
                <div 
                  key={alerta.id} 
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                    alerta.estado === 'PENDIENTE' ? severityColors[alerta.severidad] || 'border-gray-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <TipoIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alerta.titulo}
                        </h3>
                        <p className="text-gray-600 mt-1">{alerta.mensaje}</p>
                        
                        {alerta.producto && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4" />
                            <Link 
                              href={`/admin/products/${alerta.producto.slug}/editar`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {alerta.producto.nombre} (Stock: {alerta.producto.stock})
                            </Link>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {new Date(alerta.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          {alerta.resueltaPorUsuario && (
                            <span>
                              Resuelta por: {alerta.resueltaPorUsuario.nombre}
                            </span>
                          )}
                          {alerta.notasResolucion && (
                            <span className="italic">
                              "{alerta.notasResolucion}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alerta.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => actualizarEstado(alerta.id, 'EN_PROCESO')}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="Marcar en proceso"
                          >
                            <Clock className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => abrirModalResolver(alerta)}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Resolver"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => actualizarEstado(alerta.id, 'IGNORADA')}
                            className="text-gray-600 hover:text-gray-800 p-2"
                            title="Ignorar"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {alerta.estado === 'EN_PROCESO' && (
                        <button
                          onClick={() => abrirModalResolver(alerta)}
                          className="text-green-600 hover:text-green-800 p-2"
                          title="Resolver"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => eliminarAlerta(alerta.id)}
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
      {mostrarModal && alertaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resolver Alerta
            </h2>
            <p className="text-gray-600 mb-4">
              {alertaSeleccionada.titulo}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas de resolución (opcional)
              </label>
              <textarea
                value={notasResolucion}
                onChange={(e) => setNotasResolucion(e.target.value)}
                placeholder="Describe cómo se resolvió la alerta..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => actualizarEstado(alertaSeleccionada.id, 'RESUELTA')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Marcar como Resuelta
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setAlertaSeleccionada(null);
                  setNotasResolucion('');
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
        isOpen={modalEliminarOpen}
        onClose={() => {
          setModalEliminarOpen(false);
          setAlertaAEliminar(null);
        }}
        onConfirm={confirmarEliminarAlerta}
        title="¿Eliminar alerta?"
        description="Esta acción no se puede deshacer. La alerta se eliminará permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
