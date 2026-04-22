/**
 * ToastProvider - Provider global para notificaciones toast
 * Integra sonner para mostrar toasts en toda la aplicación
 */
'use client';

import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          border: '1px solid #e5e7eb',
        },
      }}
    />
  );
}

// Exportar funciones helper
export { toast };
