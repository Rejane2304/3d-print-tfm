"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export type EventType =
  // Pedidos
  | "order:new"
  | "order:status:updated"
  | "order:deleted"
  // Pagos
  | "payment:confirmed"
  // Stock
  | "stock:low"
  | "stock:updated"
  // Alertas y reseñas
  | "alert:new"
  | "alert:deleted"
  | "review:new"
  | "review:deleted"
  // Métricas
  | "metrics:update"
  // Productos
  | "product:created"
  | "product:updated"
  | "product:deleted"
  // Clientes
  | "client:created"
  | "client:updated"
  | "client:deleted"
  // Facturas
  | "invoice:created"
  | "invoice:deleted"
  // Categorías
  | "category:created"
  | "category:updated"
  | "category:deleted"
  // Cupones
  | "coupon:created"
  | "coupon:updated"
  | "coupon:deleted"
  // FAQs
  | "faq:created"
  | "faq:updated"
  | "faq:deleted"
  // Zonas de envío
  | "shipping:created"
  | "shipping:updated"
  | "shipping:deleted";

interface RealTimeEvent {
  type: EventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface UseRealTimeOptions {
  rooms?: string[];
  eventTypes?: EventType[];
  onEvent?: (event: RealTimeEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRealTime(options: UseRealTimeOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<RealTimeEvent[]>([]);
  const lastEventIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userId = session?.user?.id;

  // Polling function to fetch events from server
  const pollEvents = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/events?userId=${userId}&lastEventId=${lastEventIdRef.current || ""}`,
      );
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();

      if (data.events && data.events.length > 0) {
        const newEvents = data.events.map(
          (e: {
            id: string;
            type: string;
            payload: Record<string, unknown>;
            timestamp: Date;
          }) => ({
            type: e.type as EventType,
            payload: e.payload,
            timestamp: e.timestamp,
          }),
        );

        // Update last event ID
        const lastEvent = data.events[data.events.length - 1];
        if (lastEvent) {
          lastEventIdRef.current = lastEvent.id;
        }

        // Filter events by type if specified
        const filteredEvents = options.eventTypes
          ? newEvents.filter((e: { type: EventType }) =>
              options.eventTypes?.includes(e.type),
            )
          : newEvents;

        if (filteredEvents.length > 0) {
          setEvents((prev) => [...prev, ...filteredEvents]);
          setPendingEvents((prev) => [...prev, ...filteredEvents]);

          // Call onEvent callback for each event
          filteredEvents.forEach((event: RealTimeEvent) => {
            options.onEvent?.(event);
          });
        }
      }

      setIsConnected(true);
      options.onConnect?.();
    } catch (error) {
      console.error("Error polling events:", error);
      setIsConnected(false);
      options.onDisconnect?.();
    }
  }, [userId, options]);

  // Start polling on mount
  useEffect(() => {
    if (!userId) return;

    // Initial poll
    pollEvents();

    // Set up polling interval (every 3 seconds)
    pollingIntervalRef.current = setInterval(pollEvents, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId, pollEvents]);

  // Subscribe to specific rooms
  const subscribe = useCallback(
    async (room: string) => {
      if (!userId) return;

      try {
        await fetch("/api/events/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId }),
        });
      } catch (error) {
        console.error("Error subscribing to room:", error);
      }
    },
    [userId],
  );

  // Unsubscribe from room
  const unsubscribe = useCallback(
    async (room: string) => {
      if (!userId) return;

      try {
        await fetch("/api/events/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId }),
        });
      } catch (error) {
        console.error("Error unsubscribing from room:", error);
      }
    },
    [userId],
  );

  // Mark events as processed
  const clearEvents = useCallback(() => {
    setEvents([]);
    setPendingEvents([]);
  }, []);

  // Acknowledge specific events
  const acknowledgeEvents = useCallback(async (eventIds: string[]) => {
    try {
      await fetch("/api/events/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds }),
      });

      // Remove acknowledged events from pending
      setPendingEvents((prev) =>
        prev.filter((e) => !eventIds.includes(e.timestamp)),
      );
    } catch (error) {
      console.error("Error acknowledging events:", error);
    }
  }, []);

  return {
    isConnected,
    events,
    pendingEvents,
    subscribe,
    unsubscribe,
    clearEvents,
    acknowledgeEvents,
    hasPendingEvents: pendingEvents.length > 0,
  };
}

// Hook específico para dashboard de admin
export function useAdminRealTime(
  options: Omit<UseRealTimeOptions, "rooms"> = {},
) {
  const baseOptions: UseRealTimeOptions = {
    ...options,
    rooms: ["admin"],
  };

  return useRealTime(baseOptions);
}

// Hook específico para cuenta de usuario
export function useUserRealTime(
  userId: string,
  options: Omit<UseRealTimeOptions, "rooms"> = {},
) {
  const baseOptions: UseRealTimeOptions = {
    ...options,
    rooms: [`user:${userId}`],
  };

  return useRealTime(baseOptions);
}

// Hook específico para detalle de producto
export function useProductRealTime(
  productId: string,
  options: Omit<UseRealTimeOptions, "rooms"> = {},
) {
  const baseOptions: UseRealTimeOptions = {
    ...options,
    rooms: [`product:${productId}`],
  };

  return useRealTime(baseOptions);
}

// Hook para notificaciones toast
export function useNotificationToast() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: EventType;
      title: string;
      message: string;
      timestamp: Date;
    }>
  >([]);

  const showNotification = useCallback((event: RealTimeEvent) => {
    const id = `${event.type}-${Date.now()}`;

    const titles: Record<EventType, string> = {
      "order:new": "Nuevo Pedido",
      "order:status:updated": "Estado de Pedido Actualizado",
      "payment:confirmed": "Pago Confirmado",
      "stock:low": "Stock Bajo",
      "stock:updated": "Stock Actualizado",
      "alert:new": "Nueva Alerta",
      "review:new": "Nueva Reseña",
      "metrics:update": "Métricas Actualizadas",
    };

    const notification = {
      id,
      type: event.type,
      title: titles[event.type] || "Notificación",
      message: getNotificationMessage(event),
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  };
}

function getNotificationMessage(event: RealTimeEvent): string {
  switch (event.type) {
    case "order:new":
      return `Nuevo pedido #${event.payload.orderNumber} por €${event.payload.total}`;
    case "order:status:updated":
      return `Pedido #${event.payload.orderId} cambió a ${event.payload.status}`;
    case "payment:confirmed":
      return `Pago confirmado para pedido #${event.payload.orderId}`;
    case "stock:low":
      return `Producto con stock bajo: ${event.payload.productName}`;
    case "stock:updated":
      return `Stock actualizado: ${event.payload.productName}`;
    case "alert:new":
      return `Nueva alerta: ${event.payload.alertTitle}`;
    case "review:new":
      return `Nueva reseña de ${event.payload.rating} estrellas`;
    case "metrics:update":
      return "Métricas del dashboard actualizadas";
    default:
      return "Nueva actualización recibida";
  }
}
