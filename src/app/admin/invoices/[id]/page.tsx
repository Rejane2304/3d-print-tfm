/**
 * Invoice Detail Page - Admin
 * Solo visualización de la factura
 * Las acciones (Ver PDF, Descargar, Anular) están en el listado
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Clock, CheckCircle2, Truck, XCircle, Edit } from "lucide-react";
import {
  InvoiceViewer,
  useInvoiceData,
} from "@/components/invoices/InvoiceViewer";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  baseImponible: number;
  cuotaIva: number;
  tipoIva: number;
  total: number;
  subtotal: number;
  shipping: number;
  isCancelled: boolean;
  cancelledAt?: string | null;
  empresaNombre: string;
  empresaNif: string;
  empresaDireccion: string;
  empresaCiudad: string;
  empresaProvincia: string;
  empresaCodigoPostal: string;
  empresaEmail?: string;
  empresaTelefono?: string;
  clienteNombre: string;
  clienteNif: string;
  clienteDireccion: string;
  clienteCiudad: string;
  clienteProvincia: string;
  clienteCodigoPostal: string;
  clientePais: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  order: {
    orderNumber: string;
    paymentMethod: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      image?: string;
      description?: string;
    }>;
    usuario: {
      nombre: string;
      email: string;
      telefono?: string;
    };
  };
}

export default function AdminInvoiceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/invoices/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar factura");
      }

      setInvoice(data.factura);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/invoices");
      return;
    }

    if (status === "authenticated") {
      const user = session?.user as { rol?: string } | undefined;
      if (user?.role !== "ADMIN") {
        router.push("/");
        return;
      }
      loadInvoice();
    }
  }, [status, session, router, loadInvoice]);

  // Always call the hook, but handle null case inside
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const invoiceData = invoice ? useInvoiceData(invoice) : null;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Factura no encontrada</p>
          <Link
            href="/admin/invoices"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            ← Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Header simplificado - solo navegación */}
      <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/invoices"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Factura {invoice.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  Emitida el{" "}
                  {invoice.issuedAt
                    ? new Date(invoice.issuedAt).toLocaleDateString("es-ES")
                    : "Fecha no disponible"}
                </p>
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

      {/* Error */}
      {error && (
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 print:hidden">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Invoice Viewer - sin botones de acción */}
      <div className="py-8 px-4 print:p-0">
        <InvoiceViewer data={invoiceData} />
      </div>
    </div>
  );
}
