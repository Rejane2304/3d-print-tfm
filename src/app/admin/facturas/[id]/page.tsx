/**
 * Página de Detalle de Factura - Admin
 * Vista completa de factura con opciones de gestión
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  FileText,
  Download,
  Printer,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Calendar,
  Euro
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface FacturaDetalle {
  id: string;
  numeroFactura: string;
  emitidaEn: string;
  baseImponible: number;
  cuotaIva: number;
  tipoIva: number;
  total: number;
  anulada: boolean;
  anuladaEn?: string;
  empresaNombre: string;
  empresaNif: string;
  empresaDireccion: string;
  empresaCiudad: string;
  empresaProvincia: string;
  empresaCodigoPostal: string;
  clienteNombre: string;
  clienteNif: string;
  clienteDireccion: string;
  clienteCiudad: string;
  clienteProvincia: string;
  clienteCodigoPostal: string;
  clientePais: string;
  pedido: {
    numeroPedido: string;
    metodoPago: string;
    items: Array<{
      id: string;
      nombre: string;
      cantidad: number;
      precio: number;
      subtotal: number;
    }>;
    usuario: {
      nombre: string;
      email: string;
    };
  };
}

export default function AdminFacturaDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [factura, setFactura] = useState<FacturaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);

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
      cargarFactura();
    }
  }, [status, session, router]);

  const cargarFactura = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/facturas/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar factura');
      }

      setFactura(data.factura);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const anularFactura = async () => {
    setModalAnularOpen(true);
  };

  const confirmarAnulacion = async () => {
    try {
      const response = await fetch(`/api/admin/facturas/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModalAnularOpen(false);
        await cargarFactura();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al anular');
      }
    } catch (err) {
      setError('Error al anular factura');
    }
  };

  const descargarPDF = () => {
    window.open(`/api/admin/facturas/${params.id}/pdf`, '_blank');
  };

  const imprimir = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Factura no encontrada</p>
          <Link href="/admin/facturas" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            ← Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/facturas" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Factura {factura.numeroFactura}</h1>
                <p className="text-sm text-gray-500">
                  Emitida el {new Date(factura.emitidaEn).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!factura.anulada && (
                <button
                  onClick={anularFactura}
                  className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Anular
                </button>
              )}
              <button
                onClick={descargarPDF}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
              <button
                onClick={imprimir}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Estado Anulada */}
      {factura.anulada && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 print:hidden">
          <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>FACTURA ANULADA</strong> - Esta factura fue anulada el {factura.anuladaEn && new Date(factura.anuladaEn).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 print:hidden">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Factura Document */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Encabezado */}
          <div className="bg-gray-900 text-white p-8 print:bg-white print:text-black print:border-b-2 print:border-gray-900">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold">FACTURA</h2>
                <p className="text-xl mt-2">{factura.numeroFactura}</p>
                <p className="text-gray-300 mt-1 print:text-gray-600">
                  Fecha: {new Date(factura.emitidaEn).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold">{factura.empresaNombre}</h3>
                <p className="text-gray-300 print:text-gray-600">NIF: {factura.empresaNif}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Datos de Emisor y Receptor */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Emisor */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Vendedor
                </h4>
                <p className="font-medium">{factura.empresaNombre}</p>
                <p className="text-gray-600">NIF: {factura.empresaNif}</p>
                <p className="text-gray-600">{factura.empresaDireccion}</p>
                <p className="text-gray-600">
                  {factura.empresaCodigoPostal} {factura.empresaCiudad}
                </p>
                <p className="text-gray-600">{factura.empresaProvincia}</p>
              </div>

              {/* Receptor */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h4>
                <p className="font-medium">{factura.clienteNombre}</p>
                <p className="text-gray-600">NIF: {factura.clienteNif || 'No especificado'}</p>
                <p className="text-gray-600">{factura.clienteDireccion}</p>
                <p className="text-gray-600">
                  {factura.clienteCodigoPostal} {factura.clienteCiudad}
                </p>
                <p className="text-gray-600">
                  {factura.clienteProvincia}, {factura.clientePais}
                </p>
              </div>
            </div>

            {/* Detalle de Items */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">Conceptos</h4>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Descripción</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">Cantidad</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Precio Unit.</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {factura.pedido.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3">{item.nombre}</td>
                      <td className="text-center py-3">{item.cantidad}</td>
                      <td className="text-right py-3">{Number(item.precio).toFixed(2)} €</td>
                      <td className="text-right py-3 font-medium">{Number(item.subtotal).toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Base Imponible:</span>
                    <span>{Number(factura.baseImponible).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA ({factura.tipoIva}%):</span>
                    <span>{Number(factura.cuotaIva).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>TOTAL:</span>
                    <span>{Number(factura.total).toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Pedido:</strong> {factura.pedido.numeroPedido}</p>
                  <p><strong>Método de pago:</strong> {factura.pedido.metodoPago === 'TARJETA' ? 'Tarjeta de crédito' : 'Transferencia bancaria'}</p>
                </div>
                <div>
                  <p><strong>Email:</strong> {factura.pedido.usuario.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 print:bg-white">
            <p>Esta factura ha sido generada electrónicamente y es válida sin firma.</p>
            <p className="mt-1">3D Print TFM - E-commerce de productos impresos en 3D</p>
          </div>
        </div>
      </div>

      {/* Modal Confirmación Anular */}
      <ConfirmModal
        isOpen={modalAnularOpen}
        onClose={() => setModalAnularOpen(false)}
        onConfirm={confirmarAnulacion}
        title="¿Anular factura?"
        description="Esta acción no se puede deshacer. La factura se marcará como anulada pero permanecerá en el sistema para fines contables."
        confirmText="Anular"
        type="warning"
      />
    </div>
  );
}
