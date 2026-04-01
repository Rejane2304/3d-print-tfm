/**
 * Página de Gestión de Facturas - Admin
 * Listado y gestión de facturas
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  XCircle,
  Loader2,
  AlertCircle,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  emitidaEn: string;
  total: number;
  anulada: boolean;
  pedido: {
    numeroPedido: string;
    usuario: {
      nombre: string;
      email: string;
      nif: string | null;
    };
  };
}

export default function AdminFacturasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarGenerarModal, setMostrarGenerarModal] = useState(false);
  const [pedidoIdInput, setPedidoIdInput] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/facturas');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      cargarFacturas();
    }
  }, [status, session, router]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (filtroEstado) {
        if (filtroEstado === 'activas') params.append('anulada', 'false');
        if (filtroEstado === 'anuladas') params.append('anulada', 'true');
      }

      const response = await fetch(`/api/admin/facturas?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar facturas');
      }

      setFacturas(data.facturas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const generarFactura = async () => {
    if (!pedidoIdInput.trim()) {
      setError('Introduce el ID del pedido');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/admin/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedidoIdInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar factura');
      }

      setMostrarGenerarModal(false);
      setPedidoIdInput('');
      await cargarFacturas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const anularFactura = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta factura? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/facturas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await cargarFacturas();
      }
    } catch (err) {
      setError('Error al anular factura');
    }
  };

  const descargarPDF = (id: string, numeroFactura: string) => {
    window.open(`/api/admin/facturas/${id}/pdf`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando facturas...</p>
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
              <FileText className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Volver al Dashboard
              </Link>
              <button
                onClick={() => setMostrarGenerarModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Generar Factura
              </button>
            </div>
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de factura..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las facturas</option>
                <option value="activas">Activas</option>
                <option value="anuladas">Anuladas</option>
              </select>
            </div>
            <button
              onClick={cargarFacturas}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Tabla de facturas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron facturas
                  </td>
                </tr>
              ) : (
                facturas.map((factura) => (
                  <tr key={factura.id} className={`hover:bg-gray-50 ${factura.anulada ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {factura.numeroFactura}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {factura.pedido.usuario.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {factura.pedido.usuario.nif || 'Sin NIF'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {factura.pedido.numeroPedido}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(factura.emitidaEn).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {Number(factura.total).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {factura.anulada ? (
                        <span className="px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Anulada
                        </span>
                      ) : (
                        <span className="px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Activa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/facturas/${factura.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-2"
                          title="Ver detalle"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => descargarPDF(factura.id, factura.numeroFactura)}
                          className="text-blue-600 hover:text-blue-900 p-2"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {!factura.anulada && (
                          <button
                            onClick={() => anularFactura(factura.id)}
                            className="text-red-600 hover:text-red-900 p-2"
                            title="Anular factura"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {facturas.length} facturas
        </div>
      </div>

      {/* Modal Generar Factura */}
      {mostrarGenerarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generar Nueva Factura</h2>
            <p className="text-sm text-gray-600 mb-4">
              Introduce el ID del pedido entregado para generar una factura.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del Pedido
              </label>
              <input
                type="text"
                value={pedidoIdInput}
                onChange={(e) => setPedidoIdInput(e.target.value)}
                placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={generarFactura}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Generar
              </button>
              <button
                onClick={() => {
                  setMostrarGenerarModal(false);
                  setPedidoIdInput('');
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
