/**
 * Página de Mis Pedidos - Usuario
 * Historial completo de pedidos del usuario autenticado
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
  FileText,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';

interface Pedido {
  id: string;
  orderNumber: string;
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
    invoiceNumber: string;
    anulada: boolean;
  };
  pago?: {
    estado: string;
    metodo: string;
  };
}

const estadosConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDIENTE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pendiente' },
  PAGADO: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2, label: 'Pagado' },
  EN_PREPARACION: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Package, label: 'En preparación' },
  ENVIADO: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck, label: 'Enviado' },
  ENTREGADO: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Entregado' },
  CANCELADO: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Cancelado' },
};

export default function MisPedidosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/orders');
      return;
    }

    if (status === 'authenticated') {
      cargarPedidos();
    }
  }, [status, router]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/orders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedidos');
      }

      setPedidos(data.pedidos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = filtroEstado
    ? pedidos.filter(p => p.estado === filtroEstado)
    : pedidos;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Pedidos</h1>
              <p className="mt-2 text-gray-600">
                {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} en total
              </p>
            </div>
            <Link
              href="/account"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Volver a mi cuenta
            </Link>
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtrar por estado:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtroEstado === ''
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {Object.entries(estadosConfig).map(([estado, config]) => {
              const Icon = config.icon;
              const count = pedidos.filter(p => p.estado === estado).length;
              return (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    filtroEstado === estado
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                  {count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      filtroEstado === estado ? 'bg-indigo-500' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de pedidos */}
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filtroEstado ? 'No hay pedidos con este estado' : 'No tienes pedidos'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filtroEstado
                ? 'Prueba con otro filtro o espera a que se actualicen tus pedidos'
                : 'Aún no has realizado ningún pedido. ¡Explora nuestro catálogo!'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Package className="h-5 w-5" />
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => {
              const estadoConfig = estadosConfig[pedido.estado] || estadosConfig.PENDIENTE;
              const EstadoIcon = estadoConfig.icon;
              const primeraImagen = pedido.items[0]?.producto.images[0]?.url;

              return (
                <div
                  key={pedido.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  {/* Header del pedido */}
                  <div className="p-6 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Imagen del primer producto */}
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                          {primeraImagen ? (
                            <Image
                              src={primeraImagen}
                              alt={pedido.items[0]?.producto.nombre}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-full h-full p-4 text-gray-400" />
                          )}
                        </div>

                        {/* Info del pedido */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-semibold text-gray-900">
                              {pedido.orderNumber}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${estadoConfig.color}`}>
                              <EstadoIcon className="h-3 w-3" />
                              {estadoConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(pedido.createdAt).toLocaleDateString('es-ES')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total y acciones */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {Number(pedido.total).toFixed(2)} €
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/account/orders/${pedido.id}`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="p-6 bg-gray-50">
                    <div className="space-y-3">
                      {pedido.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              {item.quantity}x
                            </span>
                            <Link
                              href={`/products/${item.producto.slug}`}
                              className="text-gray-700 hover:text-indigo-600"
                            >
                              {item.producto.nombre}
                            </Link>
                          </div>
                          <span className="text-gray-600">
                            {(item.quantity * Number(item.unitPrice)).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                      {pedido.items.length > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          +{pedido.items.length - 3} productos más...
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                      {pedido.factura && !pedido.factura.anulada && (
                        <a
                          href={`/api/admin/invoices/${pedido.factura.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FileText className="h-4 w-4" />
                          Descargar factura
                        </a>
                      )}

                      {pedido.estado === 'ENVIADO' && (
                        <span className="text-sm text-purple-600">
                          Pedido en camino
                        </span>
                      )}

                      {pedido.estado === 'ENTREGADO' && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Entregado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
