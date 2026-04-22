'use client';

/**
 * ConfirmDialog Component
 * Dialog system for confirmations using native dialog element
 *
 * Accessibility improvements:
 * - Proper dialog element with role="dialog"
 * - Focus trap and management
 * - Escape key handling
 * - ARIA labels for all interactive elements
 * - Focus restoration on close
 */

import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

// Global state for the dialog
let dialogState: ConfirmDialogState = {
  isOpen: false,
  message: '',
  resolve: null,
};

let forceUpdate: (() => void) | null = null;

export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise(resolve => {
    dialogState = {
      ...options,
      isOpen: true,
      resolve,
    };
    forceUpdate?.();
  });
}

export function ConfirmDialogProvider() {
  const [, setTick] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    forceUpdate = () => {
      setTick(t => t + 1);
      setIsOpen(dialogState.isOpen);
    };
    return () => {
      forceUpdate = null;
    };
  }, []);

  const handleClose = useCallback((result: boolean) => {
    // Restore focus before closing
    if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
    }

    dialogState.resolve?.(result);
    dialogState = { ...dialogState, isOpen: false, resolve: null };
    setTick(t => t + 1);
    setIsOpen(false);
  }, []);

  // Save focus before opening
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(dialogRef, {
    isActive: isOpen,
    onEscape: () => handleClose(false),
    restoreFocusOnClose: false, // Manual restoration
  });

  // Focus on confirm button when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null;

  const {
    title = 'Confirmar acción',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false,
  } = dialogState;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonFocus: 'focus:ring-red-500',
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonFocus: 'focus:ring-amber-500',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      buttonFocus: 'focus:ring-indigo-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => handleClose(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}
              aria-hidden="true"
            >
              <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={() => handleClose(true)}
              disabled={isLoading}
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.buttonBg} ${styles.buttonFocus} disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
