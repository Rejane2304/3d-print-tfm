/**
 * Página de Detalle de Devolución - Cliente
 * Vista completa de una devolución específica del usuario autenticado
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Package, RotateCcw, XCircle } from 'lucide-react';
import { ReturnStatusBadge } from '@/components/returns/ReturnStatusBadge';
import { useRealTime } from '@/hooks/useRealTime';
import { toast } from 'sonner';

interface ReturnDetail {
  id: string;
  numeroPedido: string;
  estado: string;
  motivo: string;
  cantidadTotal: number;
  notasAdmin?: string | null;
  procesadoEn?: string | null;
  fechaEntregaPedido?: string;
  metodoPagoOriginal?: string;
  totalPedido: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    producto: {
      nombre: string;
      imagen?: string | null;
    };
    cantidad: number;
    precioUnitario: number;
    motivo?: string;
  }>;
}

export default function ReturnDetailPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const returnId = params.id as string;
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReturn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/returns/${returnId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar devolución');
      }

      setReturnData(data.devolucion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  // Real-time event handler for return updates
  const handleRealTimeEvent = useCallback(
    (event: { type: string; payload: Record<string, unknown> }) => {
      // Only process events for this return
      const eventReturnId = event.payload.returnId as string;
      if (eventReturnId !== returnId) {
        return;
      }

      // Filter by user ID to ensure privacy
      const eventUserId = event.payload.userId as string;
      if (eventUserId && eventUserId !== session?.user?.id) {
        return;
      }

      switch (event.type) {
        case 'return:status:updated': {
          const newStatus = event.payload.status as string;
          const returnNumber = event.payload.returnNumber as string;

          setReturnData(prevData => {
            if (!prevData) return null;
            return { ...prevData, estado: newStatus };
          });

          toast.success(`Estado de devolución actualizado`, {
            description: `Solicitud #${returnNumber} ahora está: ${newStatus}`,
          });
          break;
        }

        case 'return:new': {
          // If viewing this return and it was just created
          loadReturn();
          break;
        }
      }
    },
    [returnId, session?.user?.id, loadReturn],
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

    if (status === 'authenticated' && returnId) {
      loadReturn();
    }
  }, [status, router, returnId, loadReturn]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <RotateCcw className="h-8 w-8 text-yellow-600" />;
      case 'Aprobada':
        return <CheckCircle2 className="h-8 w-8 text-green-600" />;
      case 'Rechazada':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'Completada':
        return <CheckCircle2 className="h-8 w-8 text-blue-600" />;
      default:
        return <Package className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'Tu solicitud está siendo revisada. Te notificaremos cuando sea procesada.';
      case 'Aprobada':
        return 'Tu devolución ha sido aprobada. El reembolso se procesará en los próximos días.';
      case 'Rechazada':
        return 'Tu solicitud de devolución ha sido rechazada. Consulta las notas del administrador.';
      case 'Completada':
        return 'La devolución ha sido completada. El reembolso ya ha sido procesado.';
      default:
        return '';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando devolución...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium text-sm sm:text-base">Devolución no encontrada</p>
          <Link href="/account/returns" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block text-sm">
            ← Volver a mis devoluciones
          </Link>
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
            <Link href="/account/returns" className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Devolución #{returnData.numeroPedido}</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Solicitada el{' '}
                {new Date(returnData.createdAt).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Error */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Estado */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-full">{getStatusIcon(returnData.estado)}</div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Estado:
                      <ReturnStatusBadge status={returnData.estado} />
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{getStatusMessage(returnData.estado)}</p>
                  </div>
                </div>
              </div>

              {/* Notas del admin si fue rechazada */}
              {returnData.estado === 'Rechazada' && returnData.notasAdmin && (
                <div className="p-4 sm:p-6 bg-red-50 border-t border-red-200">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Motivo del rechazo</h3>
                  <p className="text-sm text-red-700">{returnData.notasAdmin}</p>
                </div>
              )}

              {/* Info de procesamiento si fue aprobada */}
              {(returnData.estado === 'Aprobada' || returnData.estado === 'Completada') && returnData.procesadoEn && (
                <div className="p-4 sm:p-6 bg-green-50 border-t border-green-200">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Procesada el:</span>{' '}
                    {new Date(returnData.procesadoEn).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Productos a devolver ({returnData.items.length})
                </h2>
              </div>
              <div className="divide-y">
                {returnData.items.map(item => (
                  <div key={item.id} className="p-4 sm:p-6 flex gap-3 sm:gap-4">
                    {/* Imagen */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 flex-shrink-0 overflow-hidden relative rounded">
                      {item.producto.imagen ? (
                        <Image src={item.producto.imagen} alt={item.producto.nombre} fill className="object-cover" />
                      ) : (
                        <Package className="w-full h-full p-4 sm:p-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{item.producto.nombre}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {item.cantidad} x {item.precioUnitario.toFixed(2)} €
                      </p>
                      {item.motivo && <p className="text-xs text-gray-600 mt-1 italic">Motivo: {item.motivo}</p>}
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {(item.cantidad * item.precioUnitario).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="p-4 sm:p-6 bg-gray-50 border-t">
                <div className="flex justify-between text-base sm:text-lg font-semibold">
                  <span className="text-gray-900">Importe total a devolver</span>
                  <span className="text-indigo-600">{returnData.cantidadTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-4 sm:space-y-6">
            {/* Información del pedido */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Pedido original</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-mono">{returnData.numeroPedido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span>{returnData.totalPedido.toFixed(2)} €</span>
                </div>
                {returnData.metodoPagoOriginal && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span>{returnData.metodoPagoOriginal}</span>
                  </div>
                )}
                {returnData.fechaEntregaPedido && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entregado el:</span>
                    <span>{new Date(returnData.fechaEntregaPedido).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
              <Link
                href={`/account/orders/${returnData.id.replace('ret_', 'ord_')}`}
                className="mt-4 block w-full text-center text-indigo-600 hover:text-indigo-800 font-medium text-sm py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                Ver pedido original
              </Link>
            </div>

            {/* Motivo general */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Motivo de la devolución</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{returnData.motivo}</p>
            </div>

            {/* Información de la devolución */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                Información de la devolución
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-xs">{returnData.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Solicitada el:</span>
                  <span>{new Date(returnData.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización:</span>
                  <span>{new Date(returnData.updatedAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
