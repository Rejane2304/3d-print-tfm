/**
 * Página de Solicitud de Devolución
 * Permite al cliente solicitar la devolución de un pedido entregado
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  producto: {
    nombre: string;
    slug: string;
    images: { url: string }[];
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  estado: string;
  deliveredAt?: string;
  total: number;
  items: OrderItem[];
}

const returnReasons = [
  { value: 'defective', label: 'Producto defectuoso o dañado' },
  { value: 'not_as_described', label: 'No coincide con la descripción' },
  { value: 'wrong_size', label: 'Talla/dimensiones incorrectas' },
  { value: 'wrong_item', label: 'Producto incorrecto recibido' },
  { value: 'quality', label: 'No satisfecho con la calidad' },
  { value: 'changed_mind', label: 'Cambio de opinión' },
  { value: 'late_delivery', label: 'Llegó tarde' },
  { value: 'other', label: 'Otro motivo' },
];

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  reason?: string;
}

export default function ReturnRequestPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [generalReason, setGeneralReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/account/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar pedido');
      }

      // Verificar que el pedido pueda devolverse
      if (data.pedido.estado !== 'Entregado') {
        throw new Error('Solo se pueden devolver pedidos entregados');
      }

      // Verificar ventana de 30 días
      if (data.pedido.deliveredAt) {
        const deliveredAt = new Date(data.pedido.deliveredAt);
        const now = new Date();
        const daysSinceDelivery = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceDelivery > 30) {
          throw new Error('El período de devolución de 30 días ha expirado');
        }
      }

      setOrder(data.pedido);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/orders');
      return;
    }

    if (status === 'authenticated' && params.id) {
      loadOrder();
    }
  }, [status, router, params.id, loadOrder]);

  const toggleItem = (item: OrderItem) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      if (newSelected[item.id]) {
        delete newSelected[item.id];
      } else {
        newSelected[item.id] = {
          orderItemId: item.id,
          quantity: item.quantity,
        };
      }
      return newSelected;
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity },
    }));
  };

  const updateItemReason = (itemId: string, reason: string) => {
    setItemReasons(prev => ({
      ...prev,
      [itemId]: reason,
    }));
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }));
  };

  const getTotalRefundAmount = () => {
    return Object.values(selectedItems).reduce((total, selectedItem) => {
      const orderItem = order?.items.find(i => i.id === selectedItem.orderItemId);
      if (orderItem) {
        return total + orderItem.unitPrice * selectedItem.quantity;
      }
      return total;
    }, 0);
  };

  const canSubmit = () => {
    if (Object.keys(selectedItems).length === 0) return false;
    if (!generalReason) return false;
    if (generalReason === 'other' && !otherReasonText.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!order || !canSubmit()) return;

    setSubmitting(true);
    setError(null);

    try {
      const finalReason =
        generalReason === 'other'
          ? otherReasonText
          : returnReasons.find(r => r.value === generalReason)?.label || generalReason;

      const items = Object.values(selectedItems).map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason,
      }));

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason: finalReason,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la devolución');
      }

      setSuccess(true);
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/account/returns');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium text-sm sm:text-base mb-4">{error}</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-medium text-sm sm:text-base">Pedido no encontrado</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block text-sm">
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h1>
            <p className="text-gray-600 mb-6">
              Tu solicitud de devolución ha sido recibida correctamente. Te notificaremos por email cuando sea
              procesada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/account/returns"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Ver mis devoluciones
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Volver a pedidos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = Object.keys(selectedItems).length;
  const refundAmount = getTotalRefundAmount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/account/orders/${params.id}`} className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Solicitar Devolución</h1>
              <p className="text-xs sm:text-sm text-gray-500">Pedido {order.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Info banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Política de Devoluciones</h3>
              <p className="text-sm text-blue-700 mt-1">
                Tienes 30 días desde la entrega del pedido para solicitar una devolución. Una vez aprobada, te
                reembolsaremos el importe total al método de pago original.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selección de productos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Selecciona los productos a devolver
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona los productos que deseas devolver de este pedido
                </p>
              </div>
              <div className="divide-y">
                {order.items.map(item => {
                  const isSelected = !!selectedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-6 transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={`item-${item.id}`} className="flex items-start gap-3 cursor-pointer">
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.producto.images[0]?.url ? (
                                <Image
                                  src={item.producto.images[0].url}
                                  alt={item.producto.nombre}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Package className="w-full h-full p-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm sm:text-base">{item.producto.nombre}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.quantity} x {item.unitPrice.toFixed(2)} €
                              </p>
                            </div>
                          </label>

                          {/* Campos adicionales si está seleccionado */}
                          {isSelected && (
                            <div className="mt-4 ml-19 pl-0 sm:pl-19 space-y-3">
                              <div>
                                <label
                                  htmlFor={`quantity-${item.id}`}
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Cantidad a devolver
                                </label>
                                <select
                                  id={`quantity-${item.id}`}
                                  value={selectedItems[item.id].quantity}
                                  onChange={e => updateItemQuantity(item.id, Number(e.target.value))}
                                  className="block w-24 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                  {Array.from({ length: item.quantity }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>
                                      {num} {num === 1 ? 'unidad' : 'unidades'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label
                                  htmlFor={`reason-${item.id}`}
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Motivo específico (opcional)
                                </label>
                                <input
                                  id={`reason-${item.id}`}
                                  type="text"
                                  value={itemReasons[item.id] || ''}
                                  onChange={e => updateItemReason(item.id, e.target.value)}
                                  placeholder="Ej: Producto dañado en la esquina"
                                  className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Motivo de la devolución */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Motivo de la devolución</h2>
              <div className="space-y-3">
                {returnReasons.map(reason => (
                  <label
                    key={reason.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      generalReason === reason.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason.value}
                      checked={generalReason === reason.value}
                      onChange={e => setGeneralReason(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-900">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Campo de texto si selecciona "Otro" */}
              {generalReason === 'other' && (
                <div className="mt-4">
                  <label htmlFor="other-reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe el motivo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="other-reason"
                    value={otherReasonText}
                    onChange={e => setOtherReasonText(e.target.value)}
                    rows={3}
                    placeholder="Por favor, describe el motivo de tu devolución..."
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>

              {/* Estado de selección */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span className={selectedCount > 0 ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCount > 0 ? `${selectedCount} producto(s) seleccionado(s)` : 'Selecciona productos'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      generalReason ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span className={generalReason ? 'text-gray-900' : 'text-gray-500'}>
                    {generalReason ? 'Motivo seleccionado' : 'Selecciona un motivo'}
                  </span>
                </div>
              </div>

              {/* Totales */}
              {selectedCount > 0 && (
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Productos a devolver</span>
                    <span className="text-sm font-medium">{selectedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Importe a reembolsar</span>
                    <span className="text-lg font-bold text-indigo-600">{refundAmount.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              {/* Botón de enviar */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit() || submitting}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Solicitar Devolución
                  </>
                )}
              </button>

              {/* Info adicional */}
              <div className="mt-6 space-y-3 text-sm text-gray-500">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Revisaremos tu solicitud en 24-48 horas</span>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>El reembolso se procesa en 3-5 días hábiles tras aprobación</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
