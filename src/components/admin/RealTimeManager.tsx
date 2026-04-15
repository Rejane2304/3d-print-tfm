/**
 * RealTimeManager Component
 * Maneja la conexión de tiempo real solo cuando el usuario está autenticado
 * Este componente se renderiza condicionalmente para evitar conexiones innecesarias
 */
'use client';

import { useEffect } from 'react';
import { useAdminRealTime, useNotificationToast } from '@/hooks/useRealTime';

interface RealTimeManagerProps {
  onEvent?: (type: string) => void;
}

export default function RealTimeManager({ onEvent }: RealTimeManagerProps) {
  const { pendingEvents, acknowledgeEvents } = useAdminRealTime();
  const { showNotification } = useNotificationToast();

  useEffect(() => {
    if (!pendingEvents.length) {
      return;
    }

    pendingEvents.forEach(event => {
      // Show notification for new orders and metrics updates
      if (event.type === 'order:new' || event.type === 'metrics:update' || event.type === 'stock:updated') {
        showNotification(event);
      }
      // Notify parent component
      onEvent?.(event.type);
    });

    // Acknowledge events
    acknowledgeEvents(pendingEvents.map(e => e.timestamp));
  }, [pendingEvents, acknowledgeEvents, showNotification, onEvent]);

  // Este componente no renderiza nada visible
  return null;
}
