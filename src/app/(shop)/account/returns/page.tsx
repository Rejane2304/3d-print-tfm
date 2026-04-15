/**
 * Página de Devoluciones del Cliente
 * Lista todas las devoluciones del usuario autenticado
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2, Package, RotateCcw } from 'lucide-react';
import { ReturnStatusBadge } from '@/components/returns/ReturnStatusBadge';
import { useRealTime } from '@/hooks/useRealTime';
import { toast } from 'sonner';

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
  numeroPedido: string;
  estado: string;
  motivo: string;
  cantidadTotal: number;
  notasAdmin?: string | null;
  fechaEntregaPedido?: string;
  createdAt: string;
  updatedAt: string;
  items: ReturnItem[];
}

export default function AccountReturnsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = statusFilter ? `?status=${statusFilter}` : '';
      const response = await fetch(`/api/returns${queryParams}`);
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

  // Real-time event handler for return updates
  const handleRealTimeEvent = useCallback(
    (event: { type: string; payload: Record<string, unknown> }) => {
      // Only process events for this user
      const eventUserId = event.payload.userId as string;
      if (eventUserId && eventUserId !== session?.user?.id) {
        return;
      }

      switch (event.type) {
        case 'return:status:updated': {
          const returnId = event.payload.returnId as string;
          const newStatus = event.payload.status as string;
          const returnNumber = event.payload.returnNumber as string;

          setReturns(prevReturns =>
            prevReturns.map(ret => (ret.id === returnId ? { ...ret, estado: newStatus } : ret)),
          );

          toast.success(`Devolución actualizada`, {
            description: `Solicitud #${returnNumber} ahora está: ${newStatus}`,
          });
          break;
        }

        case 'return:new': {
          // A new return was created, refresh the list
          loadReturns();
          toast.info('Nueva devolución creada');
          break;
        }
      }
    },
    [session?.user?.id, loadReturns],
  );

  // Initialize real-time connection - desactivado para evitar bucles
  useRealTime({
    eventTypes: ['return:status:updated', 'return:new'],
    onEvent: handleRealTimeEvent,
    autoReconnect: false,
    enableSSE: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/returns');
      return;
    }

    if (status === 'authenticated') {
      loadReturns();
    }
  }, [status, router, loadReturns]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando devoluciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/account" className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Devoluciones</h1>
              <p className="text-sm text-gray-500">Gestiona tus solicitudes de devolución</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="REJECTED">Rechazada</option>
              <option value="COMPLETED">Completada</option>
            </select>
          </div>
        </div>

        {/* Returns List */}
        {returns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes devoluciones</h3>
            <p className="text-gray-600 mb-6">
              Puedes solicitar la devolución de un pedido desde la página de detalle del pedido.
            </p>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Package className="h-4 w-4" />
              Ver mis pedidos
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {returns.map(ret => (
                <Link
                  key={ret.id}
                  href={`/account/returns/${ret.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono font-semibold text-indigo-600">#{ret.numeroPedido}</span>
                        <ReturnStatusBadge status={ret.estado} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ret.motivo}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{ret.items.length} producto(s)</span>
                        <span>•</span>
                        <span>Solicitada el {new Date(ret.createdAt).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{ret.cantidadTotal.toFixed(2)} €</p>
                      <p className="text-xs text-gray-500">Importe a devolver</p>
                    </div>
                  </div>

                  {/* Admin notes for rejected returns */}
                  {ret.estado === 'Rechazada' && ret.notasAdmin && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Motivo del rechazo:</span> {ret.notasAdmin}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
