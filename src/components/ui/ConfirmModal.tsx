/**
 * Componente Modal de Confirmación Moderno
 * Para acciones destructivas (eliminar, anular, etc.)
 * Diseño consistente con Tailwind CSS y animaciones suaves
 *
 * Accessibility improvements:
 * - role="dialog" and aria-modal="true"
 * - aria-labelledby para título
 * - Focus trap con focus inicial en el botón de acción
 * - Escape key para cerrar
 * - Focus restoration al cerrar
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Trash2, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  confirmDisabled?: boolean;
}

export function ConfirmModal(props: Readonly<ConfirmModalProps>) {
  const {
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    isLoading = false,
    confirmDisabled = false,
  } = props;

  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  // Guardar el elemento con foco antes de abrir
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(modalRef, {
    isActive: isOpen,
    onEscape: onClose,
    restoreFocusOnClose: false, // Lo manejamos manualmente
  });

  // Focus inicial y restauración
  useEffect(() => {
    if (isOpen) {
      // Focus en el botón de confirmar después de un pequeño delay
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Restaurar focus al cerrar
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus();
      }
    }
  }, [isOpen]);

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  if (!isOpen) {
    return null;
  }

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
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-sm sm:max-w-lg mx-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-gray-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Icon */}
              <div
                className={`mx-auto sm:mx-0 flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full ${config.iconBg}`}
                aria-hidden="true"
              >
                <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${config.iconColor}`} />
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold leading-tight text-gray-900 pr-8" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2 sm:mt-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row-reverse sm:gap-3 gap-2">
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirm}
                disabled={isLoading || confirmDisabled}
                className={`w-full sm:w-auto inline-flex justify-center items-center rounded-xl px-4 sm:px-5 py-3 text-sm font-semibold text-white shadow-sm ${config.buttonBg} ${config.buttonFocus} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[48px] sm:min-w-[120px]`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-white px-4 sm:px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 min-h-[48px] sm:min-w-[120px]"
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
