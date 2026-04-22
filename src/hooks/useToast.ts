/**
 * useToast Hook
 * Hook para mostrar toasts desde cualquier componente
 * Wrapper sobre sonner toast con métodos predefinidos
 */
import { toast } from 'sonner';

interface PromiseMessages {
  loading: string;
  success: string;
  error: string;
}

export function useToast() {
  return {
    success: (message: string, options?: object) => toast.success(message, options),
    error: (message: string, options?: object) => toast.error(message, options),
    warning: (message: string, options?: object) => toast.warning(message, options),
    info: (message: string, options?: object) => toast.info(message, options),
    loading: (message: string, options?: object) => toast.loading(message, options),
    promise: <T>(promise: Promise<T>, messages: PromiseMessages) => toast.promise(promise, messages),
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
    custom: (message: string, options?: object) => toast(message, options),
  };
}
