'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminRealTime } from '@/hooks/useRealTime';

interface DashboardMetricsUpdaterProps {
  onMetricsUpdate: () => void;
}

export default function DashboardMetricsUpdater({ onMetricsUpdate }: DashboardMetricsUpdaterProps) {
  useSession();

  const { pendingEvents, acknowledgeEvents } = useAdminRealTime({
    onEvent: event => {
      // Update metrics when there are relevant events
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

  // Acknowledge processed events
  useEffect(() => {
    if (pendingEvents.length > 0) {
      const eventIds = pendingEvents.map(e => e.timestamp);
      acknowledgeEvents(eventIds);
    }
  }, [pendingEvents, acknowledgeEvents]);

  return null; // Invisible component, just for logic
}
