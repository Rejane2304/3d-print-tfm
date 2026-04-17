/**
 * Página de Detalle de Devolución - Admin
 * Vista completa de una devolución para administradores
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Package, RotateCcw, XCircle } from 'lucide-react';
import { ReturnStatusBadge } from '@/components/returns/ReturnStatusBadge';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAdminRealTime, useNotificationToast } from '@/hooks/useRealTime';
import { Toaster } from '@/components/ui/Toaster';

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
  usuario: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
  };
  pedido: {
    id: string;
    numeroPedido: string;
    estado: string;
    fechaEntrega?: string;
    totalPedido: number;
    metodoPago: string;
    items: Array<{
      id: string;
      nombre: string;
      cantidad: number;
      precio: number;
      imagen?: string | null;
    }>;
  };
  items: Array<{
    id: string;
    producto: {
      id?: string;
      nombre: string;
      stockActual?: number;
      imagen?: string | null;
    };
    cantidad: number;
    precioUnitario: number;
    motivo?: string;
  }>;
}

export default function AdminReturnDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time setup
  const { pendingEvents, acknowledgeEvents, isConnected } = useAdminRealTime();
  const { notifications, showNotification, removeNotification } = useNotificationToast();

  // Listen for real-time events
  useEffect(() => {
    if (pendingEvents.length > 0) {
      pendingEvents.forEach(event => {
        // Show notification for return status updates related to this return
        if (event.type === 'return:status:updated') {
          const payload = event.payload as { returnId?: string };
          if (payload.returnId === params.id) {
            showNotification(event);
            // Refresh return data
            loadReturn();
          }
        }
      });
      // Acknowledge events
      acknowledgeEvents(pendingEvents.map(e => e.timestamp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvents, params.id]);

  const loadReturn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/returns/${params.id}`);
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
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/returns');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadReturn();
    }
  }, [status, session, router, params.id, loadReturn]);

  const handleUpdateStatus = async (nuevoEstado: string, notasAdmin?: string) => {
    if (!returnData) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/returns/${returnData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, notasAdmin }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadReturn();
        await showConfirmDialog({
          title: 'Éxito',
          message: data.mensaje || 'Estado actualizado correctamente',
          confirmText: 'Aceptar',
          cancelText: '',
          variant: 'info',
        });
      } else {
        throw new Error(data.error || 'Error al actualizar estado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Aprobar devolución',
      message:
        '¿Estás seguro de que deseas aprobar esta devolución? Se restaurará el stock y se iniciará el reembolso.',
      confirmText: 'Sí, aprobar',
      cancelText: 'Cancelar',
      variant: 'info',
    });

    if (confirmed) {
      await handleUpdateStatus('Aprobada');
    }
  };

  const handleReject = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Rechazar devolución',
      message: '¿Estás seguro de que deseas rechazar esta devolución?',
      confirmText: 'Sí, rechazar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      await handleUpdateStatus('Rechazada', 'Solicitud rechazada por el administrador');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando devolución...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Devolución no encontrada</p>
          <Link href="/admin/returns" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            ← Volver a devoluciones
          </Link>
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
              <Link href="/admin/returns" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Devolución #{returnData.numeroPedido}</h1>
                <p className="text-sm text-gray-500">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado y acciones */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <RotateCcw className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Estado:
                        <ReturnStatusBadge status={returnData.estado} />
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {returnData.estado === 'Pendiente' && 'Pendiente de revisión'}
                        {returnData.estado === 'Aprobada' && 'Devolución aprobada, reembolso en proceso'}
                        {returnData.estado === 'Rechazada' && 'Devolución rechazada'}
                        {returnData.estado === 'Completada' && 'Devolución completada'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  {returnData.estado === 'Pendiente' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas del admin */}
              {returnData.notasAdmin && (
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas del administrador</h3>
                  <p className="text-sm text-gray-700">{returnData.notasAdmin}</p>
                </div>
              )}
            </div>

            {/* Productos a devolver */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos a devolver ({returnData.items.length})
                </h2>
              </div>
              <div className="divide-y">
                {returnData.items.map(item => (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden relative rounded">
                      {item.producto.imagen ? (
                        <Image src={item.producto.imagen} alt={item.producto.nombre} fill className="object-cover" />
                      ) : (
                        <Package className="w-full h-full p-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.producto.nombre}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Cantidad: {item.cantidad} × {item.precioUnitario.toFixed(2)} €
                      </p>
                      {item.producto.stockActual !== undefined && (
                        <p className="text-sm text-gray-500">Stock actual: {item.producto.stockActual} unidades</p>
                      )}
                      {item.motivo && <p className="text-sm text-gray-600 mt-1 italic">Motivo: {item.motivo}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(item.cantidad * item.precioUnitario).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Importe total a devolver</span>
                  <span className="text-indigo-600">{returnData.cantidadTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información del cliente</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{returnData.usuario.nombre}</p>
                <p className="text-gray-600">{returnData.usuario.email}</p>
                {returnData.usuario.telefono && <p className="text-gray-600">{returnData.usuario.telefono}</p>}
              </div>
            </div>

            {/* Pedido original */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pedido original</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <Link
                    href={`/admin/orders/${returnData.pedido.id}`}
                    className="font-mono text-indigo-600 hover:text-indigo-800"
                  >
                    {returnData.pedido.numeroPedido}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span>{returnData.pedido.estado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span>{returnData.pedido.totalPedido.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span>{returnData.pedido.metodoPago}</span>
                </div>
                {returnData.pedido.fechaEntrega && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entregado el:</span>
                    <span>{new Date(returnData.pedido.fechaEntrega).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Motivo */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Motivo de la devolución</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{returnData.motivo}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Real-time Notifications */}
      <Toaster notifications={notifications} onDismiss={removeNotification} />
      {isConnected && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {'Tiempo real conectado'}
          </div>
        </div>
      )}
    </div>
  );
}
