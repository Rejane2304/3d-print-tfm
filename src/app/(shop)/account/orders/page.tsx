/**
 * Página de Mis Pedidos - Usuario
 * Historial completo de pedidos del usuario autenticado
 * Responsive: mobile → 4K
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Loader2,
  Package,
  ShoppingCart,
  Truck,
  XCircle,
} from 'lucide-react';
import { InvoiceNotAvailableModal } from '@/components/invoices/InvoiceNotAvailableModal';
import { useRealTime } from '@/hooks/useRealTime';
import { toast } from 'sonner';

interface Order {
  id: string;
  numeroPedido: string;
  estado: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    producto: {
      nombre: string;
      slug: string;
      images: Array<{ url: string }>;
    };
  }>;
  factura?: {
    id: string;
    numeroFactura: string;
    anulada: boolean;
  };
  pago?: {
    estado: string;
    metodo: string;
  };
}

const estadosConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  Pendiente: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pendiente',
  },
  Confirmado: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
    label: 'Confirmado',
  },
  'En preparación': {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
    label: 'En preparación',
  },
  Enviado: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
    label: 'Enviado',
  },
  Entregado: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Entregado',
  },
  Cancelado: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Cancelado',
  },
};

export default function MyOrdersPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalReason, setInvoiceModalReason] = useState<
    'not_completed' | 'not_generated' | 'payment_pending' | 'cancelled'
  >('not_generated');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | undefined>(undefined);
  const [restoringOrder, setRestoringOrder] = useState<string | null>(null);
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);
  const [hiddenOrders, setHiddenOrders] = useState<Set<string>>(new Set());

  // Real-time event handler for order updates
  const handleRealTimeEvent = useCallback(
    (event: { type: string; payload: Record<string, unknown> }) => {
      // Only process events for this user
      const eventUserId = event.payload.userId as string;
      if (eventUserId && eventUserId !== session?.user?.id) {
        return;
      }

      switch (event.type) {
        case 'order:status:updated': {
          const orderId = event.payload.orderId as string;
          const newStatus = event.payload.status as string;
          const orderNumber = event.payload.orderNumber as string;

          setOrders(prevOrders =>
            prevOrders.map(order => (order.id === orderId ? { ...order, estado: newStatus } : order)),
          );

          toast.success(`Pedido ${orderNumber} actualizado`, {
            description: `Nuevo estado: ${newStatus}`,
          });
          break;
        }

        case 'order:new': {
          // Refresh orders list when a new order is created
          loadOrders();
          break;
        }

        case 'payment:confirmed': {
          const orderId = event.payload.orderId as string;
          const orderNumber = event.payload.orderNumber as string;

          toast.success(`Pago confirmado`, {
            description: `Pedido ${orderNumber}`,
          });

          // Refresh to show updated payment status
          setOrders(prevOrders =>
            prevOrders.map(order => {
              if (order.id === orderId && order.pago) {
                return {
                  ...order,
                  pago: { ...order.pago, estado: 'COMPLETADO' },
                };
              }
              return order;
            }),
          );
          break;
        }
      }
    },
    [session?.user?.id],
  );

  // Initialize real-time connection - desactivado para evitar bucles
  useRealTime({
    eventTypes: ['order:status:updated', 'order:new', 'payment:confirmed'],
    onEvent: handleRealTimeEvent,
    autoReconnect: false,
    enableSSE: false,
  });

  // Cargar pedidos al montar el componente
  useEffect(() => {
    if (status === 'authenticated') {
      loadOrders();
    }
  }, [status]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/orders');
      const data = await response.json();

      // eslint-disable-next-line no-negated-condition
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedidos');
      }

      setOrders(data.pedidos || []);
    } catch {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  // Recalcular pedidos cancelados
  const cancelledOrders = orders.filter(o => o.estado === 'Cancelado');

  const handleRestoreCart = async (orderId: string) => {
    try {
      setRestoringOrder(orderId);
      const response = await fetch('/api/cart/restore-from-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      // eslint-disable-next-line no-negated-condition
      if (!response.ok) {
        throw new Error('Error al restaurar carrito');
      }

      setRestoredMessage('Carrito restaurado correctamente');

      // Ocultar el pedido inmediatamente
      setHiddenOrders(prev => {
        const newSet = new Set(prev);
        newSet.add(orderId);
        return newSet;
      });

      setTimeout(() => {
        router.push('/checkout');
      }, 1500);
    } catch {
      // Error silently handled
      setRestoredMessage('Error al restaurar carrito');
    } finally {
      setRestoringOrder(null);
      setTimeout(() => setRestoredMessage(null), 3000);
    }
  };

  // Use hiddenOrders Set directly for O(1) lookup performance
  const filteredOrders = statusFilter
    ? orders.filter(o => o.estado === statusFilter && !hiddenOrders.has(o.id))
    : orders.filter(o => !hiddenOrders.has(o.id));

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Pedidos</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} en total
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6 overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-700 text-sm whitespace-nowrap">Filtrar por estado:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {Object.entries(estadosConfig).map(([estado, config]) => {
              const Icon = config.icon;
              const count = orders.filter(o => o.estado === estado).length;
              return (
                <button
                  key={estado}
                  onClick={() => setStatusFilter(estado)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                    statusFilter === estado ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{config.label}</span>
                  {count > 0 && (
                    <span
                      className={`ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                        statusFilter === estado ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pedidos cancelados - Banner informativo */}
        {cancelledOrders.length > 0 && !statusFilter && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 text-sm sm:text-base">
                  Tienes {cancelledOrders.length}{' '}
                  {cancelledOrders.length === 1 ? 'pedido cancelado' : 'pedidos cancelados'}
                </h3>
                <p className="text-orange-700 text-xs sm:text-sm mt-0.5">
                  Puedes restaurar el carrito de cualquier pedido cancelado para volver a intentar la compra.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de restauración */}
        {restoredMessage && (
          <div
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 ${
              restoredMessage.includes('Error')
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            {restoredMessage.includes('Error') ? (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            )}
            <p className={`text-sm ${restoredMessage.includes('Error') ? 'text-red-700' : 'text-green-700'}`}>
              {restoredMessage}
            </p>
          </div>
        )}

        {/* Lista de pedidos */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {statusFilter ? 'No hay pedidos con este estado' : 'No tienes pedidos'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 sm:mb-6">
              {statusFilter
                ? 'Prueba con otro filtro o espera a que se actualicen tus pedidos'
                : 'Aún no has realizado ningún pedido. ¡Explora nuestro catálogo!'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map(order => {
              const statusConfig = estadosConfig[order.estado] || estadosConfig.PENDING;
              const StatusIcon = statusConfig.icon;
              const firstItem = order.items?.[0];
              const firstImage = firstItem?.producto?.images?.[0]?.url;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Header del pedido */}
                  <div className="p-4 sm:p-6 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Imagen del primer producto */}
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                          {firstImage ? (
                            <Image
                              src={firstImage}
                              alt={firstItem?.producto?.nombre || 'Producto'}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-full h-full p-3 sm:p-4 text-gray-400" />
                          )}
                        </div>

                        {/* Info del pedido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                              {order.numeroPedido}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${statusConfig.color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              <span className="whitespace-nowrap">{statusConfig.label}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              {new Date(order.createdAt).toLocaleDateString('es-ES')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                              {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total y acciones */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">
                          {Number(order.total).toFixed(2)} €
                        </span>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          Ver detalle
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="p-4 sm:p-6 bg-gray-50">
                    <div className="space-y-2 sm:space-y-3">
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="font-medium text-gray-900">{item.quantity}x</span>
                            <Link
                              href={`/products/${item.producto?.slug || '#'}`}
                              className="text-gray-700 hover:text-indigo-600 truncate"
                            >
                              {item.producto?.nombre || 'Producto'}
                            </Link>
                          </div>
                          <span className="text-gray-600 whitespace-nowrap ml-2">
                            {(item.quantity * Number(item.unitPrice)).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-xs sm:text-sm text-gray-500 italic">
                          +{(order.items?.length || 0) - 3} productos más...
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                      {order.factura && !order.factura.anulada ? (
                        <a
                          href={`/api/account/invoices/${order.factura.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          Descargar factura
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrderNumber(order.numeroPedido);
                            if (order.estado === 'Cancelado') {
                              setInvoiceModalReason('cancelled');
                            } else if (order.estado === 'Entregado') {
                              setInvoiceModalReason('not_generated');
                            } else {
                              setInvoiceModalReason('not_completed');
                            }
                            setInvoiceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 hover:text-gray-600 font-medium"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          Factura no disponible
                        </button>
                      )}

                      {order.estado === 'SHIPPED' && (
                        <span className="text-xs sm:text-sm text-purple-600">Pedido en camino</span>
                      )}

                      {order.estado === 'DELIVERED' && (
                        <span className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          Entregado
                        </span>
                      )}

                      {/* Botón de restaurar carrito para pedidos cancelados */}
                      {order.estado === 'Cancelado' && (
                        <button
                          onClick={() => handleRestoreCart(order.id)}
                          disabled={restoringOrder === order.id}
                          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-orange-600 hover:text-orange-800 font-medium disabled:opacity-50"
                        >
                          {restoringOrder === order.id ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                              Restaurar carrito
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de factura no disponible */}
      <InvoiceNotAvailableModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orderNumber={selectedOrderNumber}
        reason={invoiceModalReason}
      />
    </div>
  );
}
