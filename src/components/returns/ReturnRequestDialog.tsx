/**
 * ReturnRequestDialog Component
 * Dialog for customers to request a return
 */

'use client';

import { useState } from 'react';
import { X, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  producto: {
    nombre: string;
    slug: string;
    images?: { url: string }[];
  };
}

interface ReturnRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  onSubmit: (data: { orderId: string; reason: string; items: ReturnItemRequest[] }) => Promise<void>;
}

interface ReturnItemRequest {
  orderItemId: string;
  quantity: number;
  reason?: string;
}

const returnReasons = [
  'Producto defectuoso o dañado',
  'No coincide con la descripción',
  'Talla/dimensiones incorrectas',
  'Producto incorrecto recibido',
  'No satisfecho con la calidad',
  'Cambio de opinión',
  'Llegó tarde',
  'Otro motivo',
];

export function ReturnRequestDialog({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  items,
  onSubmit,
}: ReturnRequestDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
  const [generalReason, setGeneralReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleItemToggle = (itemId: string, maxQuantity: number) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      if (newSelected[itemId]) {
        delete newSelected[itemId];
        const newReasons = { ...itemReasons };
        delete newReasons[itemId];
        setItemReasons(newReasons);
      } else {
        newSelected[itemId] = maxQuantity;
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const handleItemReasonChange = (itemId: string, reason: string) => {
    setItemReasons(prev => ({
      ...prev,
      [itemId]: reason,
    }));
  };

  const selectedItemsCount = Object.keys(selectedItems).length;
  const totalAmount = Object.entries(selectedItems).reduce((sum, [itemId, quantity]) => {
    const item = items.find(i => i.id === itemId);
    return sum + (item ? item.unitPrice * quantity : 0);
  }, 0);

  const handleSubmit = async () => {
    if (selectedItemsCount === 0) {
      setError('Debe seleccionar al menos un producto');
      return;
    }

    if (!generalReason.trim() || generalReason.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    const returnItems: ReturnItemRequest[] = Object.entries(selectedItems).map(([itemId, quantity]) => ({
      orderItemId: itemId,
      quantity,
      reason: itemReasons[itemId],
    }));

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        orderId,
        reason: generalReason,
        items: returnItems,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedItems({});
        setItemReasons({});
        setGeneralReason('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          aria-label="Cerrar diálogo"
        />

        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Solicitar Devolución</h2>
                <p className="text-sm text-gray-500">Pedido #{orderNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-gray-600">
                  Tu solicitud de devolución ha sido recibida. Te notificaremos cuando sea procesada.
                </p>
              </div>
            ) : (
              <>
                {/* Error */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Items Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Selecciona los productos a devolver</h3>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          selectedItems[item.id]
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!selectedItems[item.id]}
                            onChange={() => handleItemToggle(item.id, item.quantity)}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{item.producto.nombre}</p>
                              <span className="text-sm text-gray-600">{item.unitPrice.toFixed(2)} €</span>
                            </div>
                            {selectedItems[item.id] && (
                              <div className="mt-3 space-y-3">
                                <div>
                                  <label htmlFor={`quantity-${item.id}`} className="text-xs text-gray-600">
                                    Cantidad a devolver
                                  </label>
                                  <select
                                    id={`quantity-${item.id}`}
                                    value={selectedItems[item.id]}
                                    onChange={e => handleQuantityChange(item.id, Number(e.target.value))}
                                    className="mt-1 block w-24 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  >
                                    {Array.from({ length: item.quantity }, (_, i) => i + 1).map(num => (
                                      <option key={num} value={num}>
                                        {num}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`reason-${item.id}`} className="text-xs text-gray-600">
                                    Motivo específico (opcional)
                                  </label>
                                  <input
                                    id={`reason-${item.id}`}
                                    type="text"
                                    value={itemReasons[item.id] || ''}
                                    onChange={e => handleItemReasonChange(item.id, e.target.value)}
                                    placeholder="Ej: Producto dañado"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Reason */}
                <div className="mb-6">
                  <label htmlFor="general-reason" className="block text-sm font-medium text-gray-900 mb-2">
                    Motivo de la devolución <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="general-reason"
                    value={generalReason}
                    onChange={e => setGeneralReason(e.target.value)}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 mb-2"
                  >
                    <option value="">Selecciona un motivo</option>
                    {returnReasons.map(reason => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={generalReason}
                    onChange={e => setGeneralReason(e.target.value)}
                    placeholder="Describe el motivo de tu devolución (mínimo 10 caracteres)"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Summary */}
                {selectedItemsCount > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Productos seleccionados</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedItemsCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Importe a devolver</p>
                        <p className="text-lg font-semibold text-indigo-600">{totalAmount.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedItemsCount === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Solicitar Devolución'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
