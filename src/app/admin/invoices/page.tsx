/**
 * Invoice Management Page - Admin
 * Invoice listing and management with DataTable component
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2,
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Eye,
  XCircle,
  Trash2
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '@/components/ui/DataTable';
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

export default function AdminInvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      if (statusFilter) {
        if (statusFilter === 'active') params.append('anulada', 'false');
        if (statusFilter === 'cancelled') params.append('anulada', 'true');
      }

      const response = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error loading invoices');
      }

      setInvoices(data.facturas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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
      setError('Enter order number');
      return;
    }

    try {
      setError(null);

      const searchResponse = await fetch(`/api/admin/orders?search=${encodeURIComponent(orderIdInput.trim())}`);
      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error('Error searching order');
      }

      const pedido = searchData.pedidos?.find((p: { orderNumber: string }) =>
        p.orderNumber.toLowerCase() === orderIdInput.trim().toLowerCase()
      );

      if (!pedido) {
        throw new Error('Order not found with that number');
      }

      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pedido.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error generating invoice');
      }

      setShowGenerateModal(false);
      setOrderIdInput('');
      setSuccessMessage('Invoice generated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
      setError('Error cancelling invoice');
    }
  };

  const openPDF = (id: string) => {
    window.open(`/api/admin/invoices/${id}/pdf`, '_blank');
  };

  const handleDeleteInvoices = async (selectedIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoice(s)?`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' })
        )
      );
      await loadInvoices();
    } catch (error) {
      console.error('Error deleting invoices:', error);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      render: (value) => (
        <div className="text-sm font-medium text-indigo-600">{value as string}</div>
      ),
    },
    {
      key: 'pedido',
      header: 'Customer',
      render: (value) => {
        const pedido = value as { usuario: { nombre: string; email: string; nif: string | null } };
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{pedido.usuario.nombre}</div>
            <div className="text-sm text-gray-500">{pedido.usuario.nif || 'No NIF'}</div>
          </div>
        );
      },
    },
    {
      key: 'pedido',
      header: 'Order',
      render: (value) => {
        const pedido = value as { orderNumber: string };
        return (
          <div className="text-sm text-gray-900">{pedido.orderNumber}</div>
        );
      },
    },
    {
      key: 'emitidaEn',
      header: 'Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value 
            ? new Date(value as string).toLocaleDateString('en-US')
            : 'Date not available'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-medium">
          ${Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'anulada',
      header: 'Status',
      sortable: true,
      render: (value) => (
        value ? (
          <span className="px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        ) : (
          <span className="px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/invoices/${row.id}`}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="View Invoice Details"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPDF(row.id);
            }}
            disabled={row.anulada}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={row.anulada ? "Invoice cancelled - not available" : "Download PDF"}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {!row.anulada && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelInvoice(row.id);
              }}
              className="text-red-600 hover:text-red-900 p-2"
              title="Cancel Invoice"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handleDeleteInvoices,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoices...</p>
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
              <FileText className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                &larr; Back to Dashboard
              </Link>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                data-testid="generate-invoice-button"
              >
                <Plus className="h-5 w-5" />
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Invoices</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices DataTable */}
        <DataTable<Invoice>
          data={invoices}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={['invoiceNumber', 'pedido.usuario.nombre', 'pedido.orderNumber']}
          searchPlaceholder="Search by invoice number..."
          pagination
          selectable
          bulkActions={bulkActions}
          exportable
          exportFilename="invoices.csv"
          emptyMessage="No invoices found"
          noResultsMessage="No invoices match your search"
        />
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate New Invoice</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the delivered order ID to generate an invoice.
            </p>
            <div className="mb-4">
              <label htmlFor="orderIdInput" className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                type="text"
                id="orderIdInput"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Ex: ORD-2024-0001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateInvoice}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setOrderIdInput('');
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setInvoiceToCancel(null);
        }}
        onConfirm={confirmCancel}
        title="Cancel Invoice?"
        description="This action cannot be undone. The invoice will be marked as cancelled but will remain in the system for accounting purposes."
        confirmText="Cancel Invoice"
        type="warning"
      />
    </div>
  );
}
