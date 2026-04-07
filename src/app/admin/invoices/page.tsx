/**
 * Página de Gestión de Facturas - Admin
 * Listado y gestión de facturas
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  FileText, 
  XCircle,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Eye
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Invoice {
  id: string;
  invoiceNumber: string;
  emitidaEn: string;
  total: number;
  anulada: boolean;
  pedido: {
    orderNumber: string;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append('busqueda', search);
      if (statusFilter) {
        if (statusFilter === 'activas') params.append('anulada', 'false');
        if (statusFilter === 'anuladas') params.append('anulada', 'true');
      }

      const response = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar facturas');
      }

      setInvoices(data.facturas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/invoices');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.rol !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadInvoices();
    }
  }, [status, session, router, loadInvoices]);

  const generateInvoice = async () => {
    if (!orderIdInput.trim()) {
      setError('Introduce el número de pedido');
      return;
    }

    try {
      setError(null);

      // Primero buscar el pedido por orderNumber para obtener el ID
      const searchResponse = await fetch(`/api/admin/orders?search=${encodeURIComponent(orderIdInput.trim())}`);
      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error('Error al buscar pedido');
      }

      const pedido = searchData.pedidos?.find((p: { orderNumber: string }) =>
        p.orderNumber.toLowerCase() === orderIdInput.trim().toLowerCase()
      );

      if (!pedido) {
        throw new Error('No se encontró el pedido con ese número');
      }

      // Ahora generar la factura con el ID del pedido
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pedido.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar factura');
      }

      setShowGenerateModal(false);
      setOrderIdInput('');
      setSuccessMessage('Factura generada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    }
  };

  const cancelInvoice = async (id: string) => {
    setInvoiceToCancel(id);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!invoiceToCancel) return;

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceToCancel}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCancelModalOpen(false);
        setInvoiceToCancel(null);
        await loadInvoices();
      }
    } catch {
      setError('Error al anular factura');
    }
  };

  const openPDF = (id: string) => {
    window.open(`/api/admin/invoices/${id}/pdf`, '_blank');
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
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                data-testid="generate-invoice-button"
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

        {/* Success */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3" data-testid="invoice-generated-message">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las facturas</option>
                <option value="activas">Activas</option>
                <option value="anuladas">Anuladas</option>
              </select>
            </div>
            <button
              onClick={loadInvoices}
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron facturas
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.anulada ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.pedido.usuario.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.pedido.usuario.nif || 'Sin NIF'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.pedido.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.emitidaEn
                        ? new Date(invoice.emitidaEn).toLocaleDateString('es-ES')
                        : 'Fecha no disponible'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {Number(invoice.total).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.anulada ? (
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
                          href={`/admin/invoices/${invoice.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Ver detalle de la factura"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Detalle</span>
                        </Link>
                        <button
                          onClick={() => openPDF(invoice.id)}
                          disabled={invoice.anulada}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={invoice.anulada ? "Factura anulada - no disponible" : "Descargar PDF"}
                          data-testid="view-invoice-button"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        {!invoice.anulada && (
                          <button
                            onClick={() => cancelInvoice(invoice.id)}
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
          Mostrando {invoices.length} facturas
        </div>
      </div>

      {/* Modal Generar Factura */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generar Nueva Factura</h2>
            <p className="text-sm text-gray-600 mb-4">
              Introduce el ID del pedido entregado para generar una factura.
            </p>
            <div className="mb-4">
              <label htmlFor="orderIdInput" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pedido
              </label>
              <input
                type="text"
                id="orderIdInput"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Ej: ORD-2024-0001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateInvoice}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Generar
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setOrderIdInput('');
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

      {/* Modal Confirmación Anular */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setInvoiceToCancel(null);
        }}
        onConfirm={confirmCancel}
        title="¿Anular factura?"
        description="Esta acción no se puede deshacer. La factura se marcará como anulada pero permanecerá en el sistema para fines contables."
        confirmText="Anular"
        type="warning"
      />
    </div>
  );
}
