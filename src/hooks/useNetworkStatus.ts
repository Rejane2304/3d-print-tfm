/**
 * Hook para detectar el estado de la conexión de red
 * Proporciona información sobre conectividad y sincronización
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  /** Si está conectado a internet */
  isOnline: boolean;
  /** Si estuvo offline y volvió a estar online */
  wasOffline: boolean;
  /** Tipo de conexión (wifi, 4g, etc) */
  connectionType: string;
  /** Si la conexión es considerada lenta */
  isSlowConnection: boolean;
}

/**
 * Hook para monitorear el estado de la red
 * @returns NetworkStatus con información de conectividad
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // Actualizar información de conexión
  const updateConnectionInfo = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection =
      (navigator as any).connection ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).mozConnection ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).webkitConnection;

    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown');

      // Considerar lento si es 2g o slower
      const slowTypes = ['slow-2g', '2g'];
      setIsSlowConnection(slowTypes.includes(connection.effectiveType));
    }
  }, []);

  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    updateConnectionInfo();

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);

      // Reset después de 3 segundos
      setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar cambios en la conexión (tipo, velocidad)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection =
      (navigator as any).connection ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).mozConnection ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateConnectionInfo]);

  return {
    isOnline,
    wasOffline,
    connectionType,
    isSlowConnection,
  };
}

/**
 * Hook para detectar cuando se recupera la conexión
 * Útil para sincronizar datos pendientes
 * @param callback Función a ejecutar cuando se recupera la conexión
 */
export function useOnNetworkRestore(callback: () => void): void {
  useEffect(() => {
    let wasOffline = false;

    const handleOnline = () => {
      if (wasOffline) {
        callback();
      }
      wasOffline = false;
    };

    const handleOffline = () => {
      wasOffline = true;
    };

    // Estado inicial
    wasOffline = !navigator.onLine;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [callback]);
}
