/**
 * Página de Historial de Inventario - Admin
 * Muestra el historial de movimientos de un producto específico
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  ArrowLeft,
  Package,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  stockActual: number;
  imagen: string | null;
}

interface Movimiento {
  id: string;
  tipo: 'IN' | 'OUT' | 'ADJUST';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  razon: string;
  fecha: string;
  usuario: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryData {
  success: boolean;
  producto: Producto;
  movimientos: Movimiento[];
  pagination: Pagination;
}

const tipoMovimientoConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  IN: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: Plus,
    label: 'Entrada',
  },
  OUT: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: Minus,
    label: 'Salida',
  },
  ADJUST: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: RotateCcw,
    label: 'Ajuste',
  },
};

export default function InventoryHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const productId = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/inventory');
      return;
    }

    const user = session?.user as { rol?: string } | undefined;
    if (status === 'authenticated' && user?.rol !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && productId) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, productId, pagination.page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(
        `/api/admin/inventory/${productId}/history?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar historial');
      }

      setData(result);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return 'text-red-600';
    if (stock <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">
            {error || 'Producto no encontrado'}
          </p>
          <Link
            href="/admin/inventory"
            className="text-indigo-600 hover:text-indigo-900 mt-4 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a inventario
          </Link>
        </div>
      </div>
    );
  }

  const { producto, movimientos } = data;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/inventory" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historial de Inventario</h1>
                <p className="text-sm text-gray-500">{producto.nombre}</p>
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

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con información del producto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Imagen del producto */}
            {producto.imagen ? (
              <div className="flex-shrink-0 h-24 w-24 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={producto.imagen}
                  alt={producto.nombre}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
            )}

            {/* Información del producto */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {producto.nombre}
              </h1>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Stock actual:</span>
                  <span
                    className={`text-2xl font-bold ${getStockStatusColor(
                      producto.stockActual
                    )}`}
                  >
                    {producto.stockActual}
                  </span>
                </div>
              </div>
            </div>

            {/* Icono de historial */}
            <div className="hidden sm:flex h-16 w-16 bg-indigo-100 rounded-full items-center justify-center">
              <History className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Tabla de movimientos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Movimientos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {pagination.total} movimientos
            </p>
          </div>

          {movimientos.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razón
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.map((movimiento) => {
                    const tipoConfig =
                      tipoMovimientoConfig[movimiento.tipo] ||
                      tipoMovimientoConfig.ADJUST;
                    const TipoIcon = tipoConfig.icon;

                    return (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(movimiento.fecha)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(movimiento.fecha)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConfig.bgColor} ${tipoConfig.color}`}
                          >
                            <TipoIcon className="h-3 w-3 mr-1" />
                            {tipoConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              movimiento.tipo === 'IN'
                                ? 'text-green-600'
                                : movimiento.tipo === 'OUT'
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {movimiento.tipo === 'IN' && '+'}
                            {movimiento.tipo === 'OUT' && '-'}
                            {movimiento.tipo === 'ADJUST' &&
                              (movimiento.cantidad >= 0 ? '+' : '')}
                            {movimiento.cantidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="text-gray-400">
                              {movimiento.stockAnterior}
                            </span>
                            <span className="mx-2">→</span>
                            <span
                              className={`font-medium ${getStockStatusColor(
                                movimiento.stockNuevo
                              )}`}
                            >
                              {movimiento.stockNuevo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {movimiento.razon}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {movimiento.usuario}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Mostrando{' '}
              {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{' '}
              de {pagination.total} movimientos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page - 1,
                  }))
                }
                disabled={pagination.page === 1}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
