/**
 * ErrorMessage Component
 * Componente reutilizable para mostrar errores
 */
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'card' | 'fullPage';
}

export function ErrorMessage({ title = 'Error', message, onRetry, onDismiss, variant = 'card' }: ErrorMessageProps) {
  const content = (
    <>
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        {(onRetry || onDismiss) && (
          <div className="mt-4 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (variant === 'fullPage') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex">{content}</div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200">
        <div className="flex">{content}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-red-50 p-6 border border-red-200 shadow-sm">
      <div className="flex">{content}</div>
    </div>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Algo salió mal</h2>
          <p className="mt-2 text-gray-600">{error.message || 'Ha ocurrido un error inesperado'}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
