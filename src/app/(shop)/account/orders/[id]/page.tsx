/**
 * Página de Detalle de Pedido - Usuario
 * Vista completa de un pedido específico del usuario autenticado
 * Responsive: mobile → 4K
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  Phone,
  MessageSquare,
  Printer,
  Download,
} from "lucide-react";
import OrderProgressBar from "@/components/orders/OrderProgressBar";
import { InvoiceNotAvailableModal } from "@/components/invoices/InvoiceNotAvailableModal";

interface OrderDetail {
  id: string;
  orderNumber: string;
  estado: string;
  subtotal: number;
  envio: number;
  descuento?: number | null;
  cupon?: {
    code: string;
    type: string;
  } | null;
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
  metodoPago: string;
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
  messages: Array<{
    id: string;
    mensaje: string;
    tipoRemitente: string;
    createdAt: string;
  }>;
}

// El método de pago ya viene traducido de la API
const metodosPago: Record<string, string> = {
  Tarjeta: "Tarjeta",
  PAYPAL: "PayPal",
  PayPal: "PayPal",
  BIZUM: "Bizum",
  Bizum: "Bizum",
  TRANSFER: "Transferencia",
  Transferencia: "Transferencia",
};

// Traducir nombres de dirección comunes
const translateAddressName = (name: string): string => {
  const translations: { [key: string]: string } = {
    home: "Casa",
    house: "Casa",
    work: "Trabajo",
    office: "Oficina",
    apartment: "Apartamento",
    flat: "Piso",
    parents: "Casa de padres",
    family: "Casa familiar",
  };
  const lowerName = name?.toLowerCase().trim();
  return translations[lowerName] || name;
};

export default function OrderDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalReason, setInvoiceModalReason] = useState<
    "not_completed" | "not_generated" | "payment_pending" | "cancelled"
  >("not_generated");

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/account/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar pedido");
      }

      setOrder(data.pedido);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/account/orders");
      return;
    }

    if (status === "authenticated" && params.id) {
      loadOrder();
    }
  }, [status, router, params.id, loadOrder]);

  const downloadInvoice = () => {
    if (order?.factura && !order.factura.anulada) {
      window.open(`/api/account/invoices/${order.factura.id}/pdf`, "_blank");
    } else {
      if (order?.estado === "Cancelado") {
        setInvoiceModalReason("cancelled");
      } else if (order?.estado !== "Entregado") {
        setInvoiceModalReason("not_completed");
      } else {
        setInvoiceModalReason("not_generated");
      }
      setInvoiceModalOpen(true);
    }
  };

  const printOrder = async () => {
    if (order?.factura && !order.factura.anulada) {
      try {
        window.open(`/api/account/invoices/${order.factura.id}/pdf`, "_blank");
      } catch (error) {
        console.error("Error al abrir factura:", error);
        setInvoiceModalReason("not_generated");
        setInvoiceModalOpen(true);
      }
    } else if (order?.factura?.anulada) {
      setInvoiceModalReason("cancelled");
      setInvoiceModalOpen(true);
    } else {
      if (order?.estado === "Cancelado") {
        setInvoiceModalReason("cancelled");
      } else if (order?.estado !== "Entregado") {
        setInvoiceModalReason("not_completed");
      } else {
        setInvoiceModalReason("not_generated");
      }
      setInvoiceModalOpen(true);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">
            Cargando pedido...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium text-sm sm:text-base">
            Pedido no encontrado
          </p>
          <Link
            href="/account/orders"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block text-sm"
          >
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
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/account/orders"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Pedido {order.orderNumber}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Realizado el{" "}
                  {new Date(order.createdAt).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={printOrder}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                Imprimir
              </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Componente de Barra de Progreso */}
            <OrderProgressBar
              estado={order.estado}
              estadoPago={order.pago?.estado}
              metodoPago={order.pago?.metodo}
              numeroSeguimiento={order.numeroSeguimiento}
              transportista={order.transportista}
            />

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Productos ({order.items.length})
                </h2>
              </div>
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 flex gap-3 sm:gap-4">
                    {/* Imagen */}
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 flex-shrink-0 overflow-hidden relative rounded">
                      {item.producto.images[0]?.url ? (
                        <Image
                          src={item.producto.images[0].url}
                          alt={item.producto.nombre}
                          fill
                          sizes="(max-width: 640px) 64px, 96px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-full h-full p-4 sm:p-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.producto.slug}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 text-sm sm:text-base"
                      >
                        {item.producto.nombre}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {item.quantity} x {Number(item.unitPrice).toFixed(2)} €
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {Number(item.subtotal).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="p-4 sm:p-6 bg-gray-50 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{Number(order.subtotal).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span>{Number(order.envio).toFixed(2)} €</span>
                  </div>
                  {order.descuento && order.descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        Descuento
                        {order.cupon && (
                          <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                            {order.cupon.code}
                          </span>
                        )}
                      </span>
                      <span>-{Number(order.descuento).toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-semibold pt-2 border-t">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">
                      {Number(order.total).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            {order.messages.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4 sm:p-6 border-b">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Mensajes ({order.messages.length})
                  </h2>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {order.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 sm:p-4 rounded-lg ${
                        message.tipoRemitente === "ADMIN"
                          ? "bg-indigo-50 border border-indigo-100"
                          : "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            message.tipoRemitente === "ADMIN"
                              ? "text-indigo-700"
                              : "text-gray-700"
                          }`}
                        >
                          {message.tipoRemitente === "ADMIN"
                            ? "Administrador"
                            : "Tú"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleDateString(
                            "es-ES",
                          )}{" "}
                          {new Date(message.createdAt).toLocaleTimeString(
                            "es-ES",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.mensaje}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-4 sm:space-y-6">
            {/* Acciones rápidas */}
            {order.factura && !order.factura.anulada && (
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">
                  Factura
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Número:</span>
                    <span className="font-mono">
                      {order.factura.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Fecha:</span>
                    <span>
                      {new Date(order.factura.emitidaEn).toLocaleDateString(
                        "es-ES",
                      )}
                    </span>
                  </div>
                  <button
                    onClick={downloadInvoice}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                    Descargar factura PDF
                  </button>
                </div>
              </div>
            )}

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Dirección de envío
              </h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-medium text-gray-900">
                  {translateAddressName(order.nombreEnvio)}
                </p>
                <p className="text-gray-600">{order.shippingAddress}</p>
                {order.complementoEnvio && (
                  <p className="text-gray-600">{order.complementoEnvio}</p>
                )}
                <p className="text-gray-600">
                  {order.postalCodeEnvio} {order.ciudadEnvio}
                </p>
                <p className="text-gray-600">
                  {order.provinciaEnvio}, {order.paisEnvio}
                </p>
                <div className="flex items-center gap-2 pt-1 text-gray-600">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  {order.telefonoEnvio}
                </div>
              </div>
            </div>

            {/* Información de pago */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Información de pago
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">
                    {metodosPago[order.metodoPago] ||
                      order.metodoPago ||
                      "No disponible"}
                  </span>
                </div>
                {order.pago && (
                  <>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Estado:</span>
                      <span
                        className={`font-medium ${
                          order.pago.estado === "COMPLETADO"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {order.pago.estado === "COMPLETADO"
                          ? "Pagado"
                          : order.pago.estado}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Fecha:</span>
                      <span>
                        {new Date(order.pago.createdAt).toLocaleDateString(
                          "es-ES",
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Información del pedido */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                Información
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-mono">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actualizado:</span>
                  <span>
                    {new Date(order.updatedAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de factura no disponible */}
      <InvoiceNotAvailableModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orderNumber={order?.orderNumber}
        reason={invoiceModalReason}
      />
    </div>
  );
}
