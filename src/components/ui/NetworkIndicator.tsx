/**
 * NetworkIndicator Component
 * Muestra el estado de la conexión de red
 */

'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkIndicatorProps {
  /** Posición del indicador */
  position?: 'top' | 'bottom';
  /** Mostrar indicador de conexión lenta */
  showSlowConnection?: boolean;
}

export function NetworkIndicator({
  position = 'top',
  showSlowConnection = true,
}: NetworkIndicatorProps): React.ReactElement | null {
  const { isOnline, wasOffline, isSlowConnection } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  // Manejar mensaje de "conexión restablecida"
  useEffect(() => {
    if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  // No mostrar nada si todo está bien
  if (isOnline && !showRestored && !isSlowConnection) {
    return null;
  }

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  // Estado: Sin conexión
  if (!isOnline) {
    return (
      <div
        className={`fixed ${positionClasses} left-0 right-0 bg-yellow-500 text-white text-center py-2.5 z-50 shadow-md`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Sin conexión. Algunas funciones pueden no estar disponibles.</span>
        </div>
      </div>
    );
  }

  // Estado: Conexión restablecida
  if (showRestored) {
    return (
      <div
        className={`fixed ${positionClasses} left-0 right-0 bg-green-500 text-white text-center py-2.5 z-50 shadow-md transition-opacity duration-500`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-2">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Conexión restablecida.</span>
        </div>
      </div>
    );
  }

  // Estado: Conexión lenta
  if (isSlowConnection && showSlowConnection) {
    return (
      <div
        className={`fixed ${positionClasses} left-0 right-0 bg-orange-500 text-white text-center py-2.5 z-50 shadow-md`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Conexión lenta. La carga puede tardar más de lo usual.</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Componente simplificado solo para modo offline
 */
export function OfflineIndicator(): React.ReactElement | null {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
      <span className="text-sm font-medium">Sin conexión</span>
    </div>
  );
}
