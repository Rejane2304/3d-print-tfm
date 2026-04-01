/**
 * Componente Modal de Confirmación Moderno
 * Para acciones destructivas (eliminar, anular, etc.)
 * Diseño consistente con Tailwind CSS y animaciones suaves
 */
'use client';

import { useEffect, useCallback } from 'react';
import { AlertTriangle, X, Trash2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  // Cerrar con ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonFocus: 'focus:ring-red-500',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
      buttonFocus: 'focus:ring-yellow-500',
    },
    info: {
      icon: AlertCircle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonFocus: 'focus:ring-blue-500',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div
                className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} sm:mx-0 sm:h-12 sm:w-12`}
              >
                <Icon className={`h-7 w-7 ${config.iconColor}`} aria-hidden="true" />
              </div>

              {/* Text */}
              <div className="mt-4 text-center sm:ml-5 sm:mt-0 sm:text-left flex-1">
                <h3
                  className="text-xl font-semibold leading-6 text-gray-900"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 sm:flex sm:flex-row-reverse sm:gap-3">
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`inline-flex w-full justify-center items-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm ${config.buttonBg} ${config.buttonFocus} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 sm:w-auto sm:min-w-[120px]`}
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
                    Procesando...
                  </>
                ) : (
                  confirmText
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 inline-flex w-full justify-center items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 sm:mt-0 sm:w-auto sm:min-w-[120px]"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
