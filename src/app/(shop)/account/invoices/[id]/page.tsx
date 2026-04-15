/**
 * Invoice Detail Page - User Account
 * SOLUCIÓN DEFINITIVA: Sin bucles infinitos
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Download, FileText, Loader2, Printer, XCircle } from 'lucide-react';
import { InvoiceViewer } from '@/components/invoices/InvoiceViewer';

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  isCancelled?: boolean;
  cancelledAt?: string | null;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  companyPhone?: string;
  companyEmail?: string;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry?: string;
  clientEmail?: string;
  clientPhone?: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    image?: string;
    description?: string;
  }>;
  subtotal: number;
  shipping: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}

export default function UserInvoiceDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PREVENIR BUCLE: useRef persiste entre renders
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (status === 'loading') return;

    hasFetched.current = true;

    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/invoices');
      return;
    }

    if (status === 'authenticated' && params.id) {
      fetchInvoice();
    }

    async function fetchInvoice() {
      try {
        setLoading(true);
        const response = await fetch(`/api/account/invoices/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar factura');
        }

        setInvoice(data.factura);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
  }, [status, params.id, router]); // Solo dependencias esenciales

  const printInvoice = () => {
    globalThis.print();
  };

  const downloadPDF = () => {
    if (invoice) {
      const link = document.createElement('a');
      link.href = `/api/account/invoices/${params.id}/pdf`;
      link.download = `factura-${invoice.invoiceNumber || params.id}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Factura no encontrada</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/account/orders" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Factura {invoice.invoiceNumber}</h1>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Emitida el{' '}
                  {new Date(invoice.issuedAt).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={printInvoice}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                onClick={downloadPDF}
                disabled={invoice.isCancelled}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estado Anulada */}
      {invoice.isCancelled && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 print:hidden">
          <div className="flex max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>FACTURA ANULADA</strong> - Esta factura fue anulada el{' '}
                {invoice.cancelledAt && new Date(invoice.cancelledAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 print:hidden">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Invoice Viewer */}
      <div className="py-8 px-4 print:p-0">
        <InvoiceViewer data={invoice} />
      </div>
    </div>
  );
}
