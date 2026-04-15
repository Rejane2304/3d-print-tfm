'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
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
    dialogState.resolve?.(result);
    dialogState = { ...dialogState, isOpen: false, resolve: null };
    setTick(t => t + 1);
    setIsOpen(false);
  }, []);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => handleClose(false)}
      role="button"
      tabIndex={-1}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            handleClose(false);
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Close button */}
        <button
          onClick={() => handleClose(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}>
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
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
