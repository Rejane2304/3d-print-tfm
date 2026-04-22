/**
 * Global Loading State
 * Loading state global para la aplicación
 */
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function GlobalLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="xl" color="primary" text="Cargando..." />
    </div>
  );
}
