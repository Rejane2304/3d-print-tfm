/**
 * Página de Detalle de Pedido - Admin
 * Vista completa del pedido con opciones de gestión
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Box,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  Edit,
} from "lucide-react";
import OrderProgressBar from "@/components/orders/OrderProgressBar";

interface OrderDetail {
  id: string;
  orderNumber: string;
  estado: string;
  total: number;
  subtotal: number;
  envio: number;
  createdAt: string;
  updatedAt: string;
  usuario: {
    nombre: string;
    email: string;
  };
  items: Array<{
    id: string;
    nombre: string;
    quantity: number;
    price: number;
    subtotal: number;
    imagenUrl?: string;
  }>;
  nombreEnvio: string;
  telefonoEnvio: string;
  direccionEnvio: string;
  complementoEnvio?: string;
  postalCodeEnvio: string;
  ciudadEnvio: string;
  provinciaEnvio: string;
  paisEnvio: string;
  paymentMethod: string;
  numeroSeguimiento?: string;
  transportista?: string;
  notasInternas?: string;
  pago?: {
    estado: string;
    metodo: string;
    createdAt: string;
  };
}

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

const orderStatuses: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  Pendiente: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Pendiente",
  },
  Confirmado: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle2,
    label: "Confirmado",
  },
  "En preparación": {
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Box,
    label: "En preparación",
  },
  Enviado: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck,
    label: "Enviado",
  },
  Entregado: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    label: "Entregado",
  },
  Cancelado: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Cancelado",
  },
};

export default function AdminPedidoDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notas, setNotas] = useState("");
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [transportista, setTransportista] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<
    string | null
  >(null);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar pedido");
      }

      setOrder(data.pedido);
      setNewStatus(data.pedido.estado);
      setNotas(data.pedido.notasInternas || "");
      setNumeroSeguimiento(data.pedido.numeroSeguimiento || "");
      setTransportista(data.pedido.transportista || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/orders");
      return;
    }

    if (status === "authenticated") {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== "ADMIN") {
        router.push("/");
        return;
      }
      loadOrder();
    }
  }, [status, session, router, loadOrder]);

  const updateStatus = async () => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          estado: newStatus,
          notasInternas: notas,
          numeroSeguimiento: numeroSeguimiento || undefined,
          transportista: transportista || undefined,
        }),
      });

      if (response.ok) {
        await loadOrder();
        setShowStatusForm(false);
        setStatusSuccessMessage("Estado actualizado correctamente");
        setTimeout(() => setStatusSuccessMessage(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar");
      }
    } catch {
      setError("Error al actualizar estado");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Pedido no encontrado</p>
          <Link
            href="/admin/orders"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            ← Volver a pedidos
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = orderStatuses[order.estado] || {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Package,
    label: order.estado,
  };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/orders"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedido {order.orderNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("es-ES")} -{" "}
                  {new Date(order.createdAt).toLocaleTimeString("es-ES")}
                </p>
              </div>
              <span
                className={`ml-4 px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-full border-2 ${statusConfig.color}`}
                data-testid="order-status"
              >
                <StatusIcon className="h-5 w-5" />
                {statusConfig.label}
              </span>
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
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {statusSuccessMessage && (
          <div
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
            data-testid="status-updated-message"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{statusSuccessMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Info principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Componente de Barra de Progreso - Admin ve el mismo progreso que el usuario */}
            <OrderProgressBar
              estado={order.estado}
              estadoPago={order.pago?.estado}
              metodoPago={order.pago?.metodo}
              numeroSeguimiento={order.numeroSeguimiento}
              transportista={order.transportista}
            />

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  Productos
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-4">
                    {item.imagenUrl ? (
                      <div className="w-24 h-24 bg-gray-100 flex-shrink-0 overflow-hidden relative">
                        <Image
                          src={item.imagenUrl}
                          alt={item.nombre}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.nombre}</p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {Number(item.price).toFixed(2)} €
                      </p>
                      <p className="text-sm text-gray-500">
                        {Number(item.subtotal).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {Number(order.subtotal).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">
                      {Number(order.envio).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {Number(order.total).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  Dirección de envío
                </h2>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900">
                  {translateAddressName(order.nombreEnvio)}
                </p>
                <p className="text-gray-600">{order.direccionEnvio}</p>
                {order.complementoEnvio && (
                  <p className="text-gray-600">{order.complementoEnvio}</p>
                )}
                <p className="text-gray-600">
                  {order.postalCodeEnvio} {order.ciudadEnvio},{" "}
                  {order.provinciaEnvio}
                </p>
                <p className="text-gray-600">{order.paisEnvio}</p>
                <p className="text-gray-600 mt-2">
                  Teléfono: {order.telefonoEnvio}
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Info y acciones */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  Cliente
                </h2>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900">
                  {order.usuario.nombre}
                </p>
                <p className="text-sm text-gray-600">{order.usuario.email}</p>
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  Método de pago
                </h2>
              </div>
              <div className="p-6">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {order.paymentMethod === "CARD" ? "Tarjeta" : "PayPal"}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-gray-500" />
                  Acciones
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {!showStatusForm ? (
                  <button
                    onClick={() => setShowStatusForm(true)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Actualizar estado
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="orderStatus"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Estado
                      </label>
                      <select
                        id="orderStatus"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        data-testid="status-dropdown"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="En preparación">En preparación</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>

                    {newStatus === "Enviado" && (
                      <>
                        <div>
                          <label
                            htmlFor="trackingNumber"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Número de seguimiento
                          </label>
                          <input
                            type="text"
                            id="trackingNumber"
                            value={numeroSeguimiento}
                            onChange={(e) =>
                              setNumeroSeguimiento(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ej: ABC123456"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="carrier"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Transportista
                          </label>
                          <input
                            type="text"
                            id="carrier"
                            value={transportista}
                            onChange={(e) => setTransportista(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ej: Correos Express"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label
                        htmlFor="internalNotes"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Notas internas
                      </label>
                      <textarea
                        id="internalNotes"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Notas para el equipo..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={updateStatus}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        data-testid="update-status-button"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setShowStatusForm(false)}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
