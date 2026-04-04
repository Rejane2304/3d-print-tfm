/**
 * Página de Detalle de Pedido - Usuario
 * Vista completa de un pedido específico del usuario autenticado
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  Phone,
  MessageSquare,
  Printer,
  Download
} from 'lucide-react';

interface PedidoDetalle {
  id: string;
  orderNumber: string;
  estado: string;
  subtotal: number;
  envio: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  nombreEnvio: string;
  telefonoEnvio: string;
  shippingAddress: string;
  complementoEnvio?: string;
  postalCodeEnvio: string;
  ciudadEnvio: string;
  provinciaEnvio: string;
  paisEnvio: string;
  paymentMethod: string;
  numeroSeguimiento?: string;
  transportista?: string;
  notasCliente?: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    producto: {
      nombre: string;
      slug: string;
      images: Array<{ url: string }>;
    };
  }>;
  factura?: {
    id: string;
    invoiceNumber: string;
    anulada: boolean;
    emitidaEn: string;
  };
  pago?: {
    estado: string;
    metodo: string;
    createdAt: string;
  };
  mensajes: Array<{
    id: string;
    mensaje: string;
    tipoRemitente: string;
    createdAt: string;
  }>;
}

const estadosConfig: Record<string, { color: string; icon: React.ElementType; label: string; description: string }> = {
  PENDIENTE: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pendiente',
    description: 'Tu pedido está pendiente de pago'
  },
  PAGADO: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
    label: 'Pagado',
    description: 'Pago confirmado, preparando tu pedido'
  },
  EN_PREPARACION: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
    label: 'En preparación',
    description: 'Estamos preparando tu pedido'
  },
  ENVIADO: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
    label: 'Enviado',
    description: 'Tu pedido está en camino'
  },
  ENTREGADO: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Entregado',
    description: 'Pedido entregado exitosamente'
  },
  CANCELADO: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Cancelado',
    description: 'El pedido ha sido cancelado'
  },
};

const metodosPago: Record<string, string> = {
  TARJETA: 'Tarjeta de crédito/débito',
  TRANSFERENCIA: 'Transferencia bancaria',
  CONTRA_REEMBOLSO: 'Contra reembolso',
  PAYPAL: 'PayPal',
};

export default function PedidoDetallePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedido = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/account/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedido');
      }

      setPedido(data.pedido);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/orders');
      return;
    }

    if (status === 'authenticated' && params.id) {
      cargarPedido();
    }
  }, [status, router, params.id, cargarPedido]);

  const descargarFactura = () => {
    if (pedido?.factura && !pedido.factura.anulada) {
      window.open(`/api/admin/invoices/${pedido.factura.id}/pdf`, '_blank');
    }
  };

  const imprimirPedido = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Pedido not found</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const estadoConfig = estadosConfig[pedido.estado] || estadosConfig.PENDIENTE;
  const EstadoIcon = estadoConfig.icon;

  // Timeline de estados
  const estadosOrden = ['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'];
  const estadoActualIndex = estadosOrden.indexOf(pedido.estado);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/account/orders"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedido {pedido.orderNumber}</h1>
                <p className="text-sm text-gray-500">
                  Realizado el {new Date(pedido.createdAt).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={imprimirPedido}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                <Printer className="h-5 w-5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado del pedido */}
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${pedido.estado === 'CANCELADO' ? 'border-red-200' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${estadoConfig.color.split(' ')[0]}`}>
                  <EstadoIcon className={`h-8 w-8 ${estadoConfig.color.split(' ')[1]}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {estadoConfig.label}
                  </h2>
                  <p className="text-gray-600 mt-1">{estadoConfig.description}</p>

                  {pedido.numeroSeguimiento && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Número de seguimiento</p>
                      <p className="text-lg font-mono text-blue-700">{pedido.numeroSeguimiento}</p>
                      {pedido.transportista && (
                        <p className="text-sm text-blue-600 mt-1">
                          Transportista: {pedido.transportista}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              {pedido.estado !== 'CANCELADO' && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    {estadosOrden.map((estado, index) => {
                      const config = estadosConfig[estado];
                      const Icon = config.icon;
                      const completado = index <= estadoActualIndex;
                      const esActual = index === estadoActualIndex;

                      return (
                        <div key={estado} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              completado
                                ? esActual
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span
                            className={`text-xs mt-2 font-medium text-center ${
                              completado ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2 px-5">
                    {estadosOrden.slice(0, -1).map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 mx-2 ${
                          index < estadoActualIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({pedido.items.length})
                </h2>
              </div>
              <div className="divide-y">
                {pedido.items.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    {/* Imagen */}
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                      {item.producto.images[0]?.url ? (
                        <Image
                          src={item.producto.images[0].url}
                          alt={item.producto.nombre}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-full h-full p-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.producto.slug}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {item.producto.nombre}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.quantity} x {Number(item.unitPrice).toFixed(2)} €
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {Number(item.subtotal).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{Number(pedido.subtotal).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span>{Number(pedido.envio).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">{Number(pedido.total).toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            {pedido.mensajes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mensajes ({pedido.mensajes.length})
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {pedido.mensajes.map((mensaje) => (
                    <div
                      key={mensaje.id}
                      className={`p-4 rounded-lg ${
                        mensaje.tipoRemitente === 'ADMIN'
                          ? 'bg-indigo-50 border border-indigo-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium ${
                          mensaje.tipoRemitente === 'ADMIN'
                            ? 'text-indigo-700'
                            : 'text-gray-700'
                        }`}>
                          {mensaje.tipoRemitente === 'ADMIN' ? 'Administrador' : 'Tú'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(mensaje.createdAt).toLocaleDateString('es-ES')} {new Date(mensaje.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700">{mensaje.mensaje}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            {pedido.factura && !pedido.factura.anulada && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Factura</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Número:</span>
                    <span className="font-mono">{pedido.factura.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date(pedido.factura.emitidaEn).toLocaleDateString('es-ES')}</span>
                  </div>
                  <button
                    onClick={descargarFactura}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Descargar factura PDF
                  </button>
                </div>
              </div>
            )}

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección de envío
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{pedido.nombreEnvio}</p>
                <p className="text-gray-600">{pedido.shippingAddress}</p>
                {pedido.complementoEnvio && (
                  <p className="text-gray-600">{pedido.complementoEnvio}</p>
                )}
                <p className="text-gray-600">
                  {pedido.postalCodeEnvio} {pedido.ciudadEnvio}
                </p>
                <p className="text-gray-600">{pedido.provinciaEnvio}, {pedido.paisEnvio}</p>
                <div className="flex items-center gap-2 pt-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  {pedido.telefonoEnvio}
                </div>
              </div>
            </div>

            {/* Información de pago */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información de pago
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">{metodosPago[pedido.paymentMethod] || pedido.paymentMethod}</span>
                </div>
                {pedido.pago && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`font-medium ${
                        pedido.pago.estado === 'COMPLETADO' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {pedido.pago.estado === 'COMPLETADO' ? 'Pagado' : pedido.pago.estado}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fecha:</span>
                      <span>{new Date(pedido.pago.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Información del pedido */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-mono">{pedido.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span>{new Date(pedido.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización:</span>
                  <span>{new Date(pedido.updatedAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
