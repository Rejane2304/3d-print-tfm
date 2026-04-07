'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminRealTime } from '@/hooks/useRealTime';

interface DashboardMetricsUpdaterProps {
  onMetricsUpdate: () => void;
}

export default function DashboardMetricsUpdater({ onMetricsUpdate }: DashboardMetricsUpdaterProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.rol;

  const { events, pendingEvents, acknowledgeEvents } = useAdminRealTime({
    onEvent: (event) => {
      // Actualizar métricas cuando hay eventos relevantes
      if (
        event.type === 'order:new' ||
        event.type === 'order:status:updated' ||
        event.type === 'payment:confirmed' ||
        event.type === 'metrics:update'
      ) {
        onMetricsUpdate();
      }
    },
  });

  // Reconocer eventos procesados
  useEffect(() => {
    if (pendingEvents.length > 0) {
      const eventIds = pendingEvents.map((e) => e.timestamp);
      acknowledgeEvents(eventIds);
    }
  }, [pendingEvents, acknowledgeEvents]);

  return null; // Componente invisible, solo para lógica
}
