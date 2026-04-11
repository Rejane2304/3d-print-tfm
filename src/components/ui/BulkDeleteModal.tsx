/**
 * Modal Mejorado para Eliminación Masiva (Bulk Delete)
 * Muestra información detallada sobre los elementos a eliminar
 */
"use client";

import { useEffect, useCallback, useState } from "react";
import { AlertTriangle, X, Trash2, Package, Users, Tag, HelpCircle, MessageSquare, Bell, Truck } from "lucide-react";

// Iconos por tipo de elemento
const typeIcons: Record<string, React.ElementType> = {
  categories: Package,
  shipping: Truck,
  faqs: HelpCircle,
  alerts: Bell,
  reviews: MessageSquare,
  coupons: Tag,
  products: Package,
  default: Package,
};

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  itemType?: string; // 'categories', 'products', 'faqs', etc.
  itemName?: string; // 'categoría', 'producto', 'FAQ', etc.
  itemNamePlural?: string; // 'categorías', 'productos', 'FAQs', etc.
  hasAssociatedItems?: boolean;
  associatedItemCount?: number;
  associatedItemType?: string; // 'productos', 'pedidos', etc.
  isLoading?: boolean;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  itemType = "items",
  itemName = "elemento",
  itemNamePlural = "elementos",
  hasAssociatedItems = false,
  associatedItemCount = 0,
  associatedItemType = "elementos",
  isLoading = false,
}: BulkDeleteModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Cerrar con ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setShowDetails(false);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const Icon = typeIcons[itemType] || typeIcons.default;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop con animación */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 w-full max-w-md sm:max-w-lg mx-auto scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente de advertencia */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-gray-900"
                  id="modal-title"
                >
                  Eliminar {selectedCount} {selectedCount === 1 ? itemName : itemNamePlural}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Resumen de selección */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {selectedCount}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {selectedCount === 1 ? itemName : itemNamePlural} seleccionados
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Se eliminarán permanentemente de la base de datos
                  </p>
                </div>
              </div>
            </div>

            {/* Advertencia de elementos asociados */}
            {hasAssociatedItems && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800">
                      Atención: Hay {associatedItemCount} {associatedItemType} asociados
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Algunos {itemNamePlural} no se pueden eliminar porque tienen {associatedItemType} vinculados. 
                      Los elementos que no puedan eliminarse permanecerán en la lista.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles expandibles */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  ¿Qué sucederá al eliminar?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    showDetails ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showDetails && (
                <div className="px-4 py-3 bg-white">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Los {itemNamePlural} se eliminarán permanentemente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>No podrán ser recuperados</span>
                    </li>
                    {hasAssociatedItems && (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>Los {itemNamePlural} con {associatedItemType} no se eliminarán</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>Esta acción se registra en el historial del sistema</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 inline-flex justify-center items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 inline-flex justify-center items-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sí, eliminar {selectedCount} {selectedCount === 1 ? itemName : itemNamePlural}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteModal;
