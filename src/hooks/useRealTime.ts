'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export type EventType =
  // Pedidos
  | 'order:new'
  | 'order:status:updated'
  | 'order:deleted'
  | 'order:new:message'
  // Pagos
  | 'payment:confirmed'
  // Stock
  | 'stock:low'
  | 'stock:updated'
  | 'stock:alert'
  // Alertas y reseñas
  | 'alert:new'
  | 'alert:deleted'
  | 'review:new'
  | 'review:deleted'
  // Devoluciones
  | 'return:new'
  | 'return:status:updated'
  // Métricas
  | 'metrics:update'
  // Productos
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  // Clientes
  | 'client:created'
  | 'client:updated'
  | 'client:deleted'
  | 'user:new'
  // Facturas
  | 'invoice:created'
  | 'invoice:deleted'
  // Categorías
  | 'category:created'
  | 'category:updated'
  | 'category:deleted'
  // Cupones
  | 'coupon:created'
  | 'coupon:updated'
  | 'coupon:deleted'
  // FAQs
  | 'faq:created'
  | 'faq:updated'
  | 'faq:deleted'
  // Zonas de envío
  | 'shipping:created'
  | 'shipping:updated'
  | 'shipping:deleted'
  // Eventos SSE internos
  | 'connection:established'
  | 'heartbeat';

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

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
  onMissedEvents?: (events: RealTimeEvent[]) => void;
  /**
   * Habilitar SSE (Server-Sent Events) como transporte primario.
   * Si es false o SSE falla, usa polling HTTP.
   * @default true
   */
  enableSSE?: boolean;
  /**
   * Reconectar automáticamente si se pierde la conexión.
   * @default true
   */
  autoReconnect?: boolean;
  /**
   * Intentos máximos de reconexión antes de fallback a polling.
   * @default 10
   */
  maxReconnectAttempts?: number;
  /**
   * Timeout para detectar desconexión (ms) - 5s sin heartbeat
   * @default 5000
   */
  heartbeatTimeout?: number;
}

interface ConnectionState {
  isConnected: boolean;
  connectionType: 'sse' | 'polling' | null;
  reconnectAttempt: number;
  status: ConnectionStatus;
  lastHeartbeatAt: Date | null;
}

/**
 * Hook para recibir eventos en tiempo real vía SSE o polling
 *
 * Características:
 * - Intenta SSE primero, fallback a polling
 * - Auto-reconexión con backoff exponencial (1s, 2s, 4s, 8s, max 30s)
 * - Detección rápida de desconexión (5s sin heartbeat)
 * - Cola de eventos perdidos con Last-Event-ID
 * - Sin memory leaks (limpia conexiones y timeouts)
 * - Múltiples transportes configurables
 */
export function useRealTime(options: UseRealTimeOptions = {}) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<RealTimeEvent[]>([]);
  const [missedEvents, setMissedEvents] = useState<RealTimeEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    connectionType: null,
    reconnectAttempt: 0,
    status: 'disconnected',
    lastHeartbeatAt: null,
  });

  const lastEventIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isManualCloseRef = useRef(false);
  const lastHeartbeatReceivedRef = useRef<number>(0);
  const userId = session?.user?.id;

  const { enableSSE = true, autoReconnect = true, maxReconnectAttempts = 10, heartbeatTimeout = 5000 } = options;

  // Calcular delay de reconexión con backoff exponencial (1s, 2s, 4s, 8s, max 30s)
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptRef.current), maxDelay);
    // Añadir jitter para evitar thundering herd
    return delay + Math.random() * 1000;
  }, []);

  // Verificar timeout de heartbeat
  const checkHeartbeatTimeout = useCallback(() => {
    const now = Date.now();
    const lastHeartbeat = lastHeartbeatReceivedRef.current;

    if (lastHeartbeat > 0 && now - lastHeartbeat > heartbeatTimeout) {
      // Heartbeat timeout detectado, reconectar
      // Forzar reconexión
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        status: 'reconnecting',
      }));

      if (autoReconnect && !isManualCloseRef.current) {
        reconnectAttemptRef.current += 1;

        if (reconnectAttemptRef.current <= maxReconnectAttempts) {
          const delay = getReconnectDelay();

          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          // Máximos intentos alcanzados, usar polling
          setConnectionState(prev => ({
            ...prev,
            status: 'disconnected',
          }));
          startPolling();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReconnect, maxReconnectAttempts, heartbeatTimeout, getReconnectDelay]);

  // Polling function para fallback
  const pollEvents = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const response = await fetch(`/api/events?userId=${userId}&lastEventId=${lastEventIdRef.current || ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();

      if (data.events && data.events.length > 0) {
        const newEvents = data.events.map(
          (e: { id: string; type: string; payload: Record<string, unknown>; timestamp: Date }) => ({
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
          ? newEvents.filter((e: { type: EventType }) => options.eventTypes?.includes(e.type))
          : newEvents;

        if (filteredEvents.length > 0) {
          setEvents(prev => [...prev, ...filteredEvents]);
          setPendingEvents(prev => [...prev, ...filteredEvents]);

          // Call onEvent callback for each event
          filteredEvents.forEach((event: RealTimeEvent) => {
            options.onEvent?.(event);
          });
        }
      }

      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        connectionType: 'polling',
        status: 'connected',
      }));
      options.onConnect?.();
    } catch (error) {
      console.error('Error polling events:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        status: 'disconnected',
      }));
      options.onDisconnect?.();
    }
  }, [userId, options]);

  // Iniciar polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately
    pollEvents();

    // Set up polling interval (every 3 seconds)
    pollingIntervalRef.current = setInterval(pollEvents, 3000);
  }, [pollEvents]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Manejar mensaje SSE
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Manejar eventos de conexión
        if (event.type === 'connection:established') {
          reconnectAttemptRef.current = 0;
          lastHeartbeatReceivedRef.current = Date.now();
          setConnectionState({
            isConnected: true,
            connectionType: 'sse',
            reconnectAttempt: 0,
            status: 'connected',
            lastHeartbeatAt: new Date(),
          });

          // Iniciar verificación de heartbeat
          if (heartbeatTimeoutRef.current) {
            clearInterval(heartbeatTimeoutRef.current);
          }
          heartbeatTimeoutRef.current = setInterval(checkHeartbeatTimeout, 2000);

          options.onConnect?.();
          return;
        }

        // Actualizar timestamp de último heartbeat
        lastHeartbeatReceivedRef.current = Date.now();
        setConnectionState(prev => ({
          ...prev,
          lastHeartbeatAt: new Date(),
        }));

        // Manejar eventos perdidos
        if (event.type === 'missed_events') {
          if (data.events && Array.isArray(data.events)) {
            const missedEventsData = data.events.map(
              (e: { type: string; payload: Record<string, unknown>; timestamp: string }) => ({
                type: e.type as EventType,
                payload: e.payload,
                timestamp: e.timestamp,
              }),
            );
            setMissedEvents(missedEventsData);
            options.onMissedEvents?.(missedEventsData);
          }
          return;
        }

        // Ignorar heartbeats normales
        if (event.type === 'heartbeat') {
          return;
        }

        // Crear evento
        const realTimeEvent: RealTimeEvent = {
          type: event.type as EventType,
          payload: data,
          timestamp: new Date().toISOString(),
        };

        // Update last event ID
        if (event.lastEventId) {
          lastEventIdRef.current = event.lastEventId;
        }

        // Filter by event type if specified
        if (options.eventTypes && !options.eventTypes.includes(realTimeEvent.type)) {
          return;
        }

        // Add to events
        setEvents(prev => [...prev, realTimeEvent]);
        setPendingEvents(prev => [...prev, realTimeEvent]);

        // Call callback
        options.onEvent?.(realTimeEvent);
      } catch (error) {
        console.error('[SSE] Error parsing event:', error);
      }
    },
    [options, checkHeartbeatTimeout],
  );

  // Conectar SSE
  const connectSSE = useCallback(() => {
    if (!userId) return;

    try {
      setConnectionState(prev => ({
        ...prev,
        status: 'connecting',
      }));

      // Cerrar conexión existente
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Crear nueva conexión SSE
      const token = userId;
      const url = new URL('/api/events/stream', window.location.origin);
      url.searchParams.set('userId', userId);
      url.searchParams.set('token', token);
      if (lastEventIdRef.current) {
        url.searchParams.set('lastEventId', lastEventIdRef.current);
      }

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      eventSource.onmessage = event => {
        handleSSEMessage(event);
      };

      // Manejar eventos específicos
      eventSource.addEventListener('connection:established', handleSSEMessage);
      eventSource.addEventListener('heartbeat', handleSSEMessage);
      eventSource.addEventListener('missed_events', handleSSEMessage);
      eventSource.addEventListener('metrics:update', handleSSEMessage);
      eventSource.addEventListener('stock:updated', handleSSEMessage);
      eventSource.addEventListener('order:updated', handleSSEMessage);

      eventSource.onerror = error => {
        console.error('[SSE] Error:', error);

        // Marcar como desconectado
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          status: 'disconnected',
        }));
        options.onDisconnect?.();

        // Cerrar conexión actual
        eventSource.close();
        eventSourceRef.current = null;

        // Limpiar intervalo de heartbeat
        if (heartbeatTimeoutRef.current) {
          clearInterval(heartbeatTimeoutRef.current);
          heartbeatTimeoutRef.current = null;
        }

        // Intentar reconexión si está habilitada y no es cierre manual
        if (!isManualCloseRef.current && autoReconnect) {
          reconnectAttemptRef.current += 1;

          if (reconnectAttemptRef.current <= maxReconnectAttempts) {
            setConnectionState(prev => ({
              ...prev,
              status: 'reconnecting',
              reconnectAttempt: reconnectAttemptRef.current,
            }));

            const delay = getReconnectDelay();
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            // Max attempts reached, fallback to polling
            setConnectionState(prev => ({
              ...prev,
              status: 'disconnected',
            }));
            startPolling();
          }
        }
      };
    } catch (error) {
      console.error('[SSE] Error creating connection:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
      }));
      // Fallback a polling
      startPolling();
    }
  }, [userId, autoReconnect, maxReconnectAttempts, getReconnectDelay, handleSSEMessage, startPolling, options]);

  // Desconectar SSE
  const disconnectSSE = useCallback(() => {
    isManualCloseRef.current = true;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    setConnectionState(prev => ({
      ...prev,
      isConnected: false,
      status: 'disconnected',
    }));
  }, []);

  // Inicializar conexión
  useEffect(() => {
    if (!userId) {
      return;
    }

    isManualCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    lastHeartbeatReceivedRef.current = 0;

    if (enableSSE) {
      // Intentar SSE primero
      connectSSE();
    } else {
      // Usar polling directamente
      startPolling();
    }

    // Cleanup
    return () => {
      isManualCloseRef.current = true;
      disconnectSSE();
      stopPolling();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearInterval(heartbeatTimeoutRef.current);
      }
    };
  }, [userId, enableSSE, connectSSE, startPolling, disconnectSSE, stopPolling]);

  // Subscribe to specific rooms
  const subscribe = useCallback(
    async (room: string) => {
      if (!userId) {
        return;
      }

      try {
        await fetch('/api/events/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room, userId }),
        });
      } catch (error) {
        console.error('Error subscribing to room:', error);
      }
    },
    [userId],
  );

  // Unsubscribe from room
  const unsubscribe = useCallback(
    async (room: string) => {
      if (!userId) {
        return;
      }

      try {
        await fetch('/api/events/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room, userId }),
        });
      } catch (error) {
        console.error('Error unsubscribing from room:', error);
      }
    },
    [userId],
  );

  // Mark events as processed
  const clearEvents = useCallback(() => {
    setEvents([]);
    setPendingEvents([]);
  }, []);

  // Clear missed events
  const clearMissedEvents = useCallback(() => {
    setMissedEvents([]);
  }, []);

  // Acknowledge specific events
  const acknowledgeEvents = useCallback(async (eventIds: string[]) => {
    try {
      await fetch('/api/events/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });

      // Remove acknowledged events from pending
      setPendingEvents(prev => prev.filter(e => !eventIds.includes(e.timestamp)));
    } catch (error) {
      console.error('Error acknowledging events:', error);
    }
  }, []);

  // Forzar reconexión
  const reconnect = useCallback(() => {
    isManualCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    lastHeartbeatReceivedRef.current = 0;
    disconnectSSE();
    stopPolling();

    if (enableSSE) {
      connectSSE();
    } else {
      startPolling();
    }
  }, [enableSSE, connectSSE, startPolling, disconnectSSE, stopPolling]);

  // Reconectar manual con delay
  const reconnectWithDelay = useCallback(async () => {
    const delay = getReconnectDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    reconnect();
  }, [getReconnectDelay, reconnect]);

  return {
    isConnected: connectionState.isConnected,
    connectionType: connectionState.connectionType,
    connectionStatus: connectionState.status,
    reconnectAttempt: connectionState.reconnectAttempt,
    lastHeartbeatAt: connectionState.lastHeartbeatAt,
    events,
    pendingEvents,
    missedEvents,
    subscribe,
    unsubscribe,
    clearEvents,
    clearMissedEvents,
    acknowledgeEvents,
    hasPendingEvents: pendingEvents.length > 0,
    hasMissedEvents: missedEvents.length > 0,
    reconnect,
    reconnectWithDelay,
  };
}

// Hook específico para dashboard de admin
export function useAdminRealTime(options: Omit<UseRealTimeOptions, 'rooms'> = {}) {
  const baseOptions: UseRealTimeOptions = {
    ...options,
    rooms: ['admin'],
  };

  return useRealTime(baseOptions);
}

// Hook específico para cuenta de usuario
export function useUserRealTime(userId: string, options: Omit<UseRealTimeOptions, 'rooms'> = {}) {
  const baseOptions: UseRealTimeOptions = {
    ...options,
    rooms: [`user:${userId}`],
  };

  return useRealTime(baseOptions);
}

// Hook específico para detalle de producto
export function useProductRealTime(productId: string, options: Omit<UseRealTimeOptions, 'rooms'> = {}) {
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
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
      timestamp: Date;
    }>
  >([]);

  const showNotification = useCallback((event: RealTimeEvent) => {
    const id = `${event.type}-${Date.now()}`;

    const titles: Record<string, string> = {
      'order:new': 'Nuevo Pedido',
      'order:status:updated': 'Estado de Pedido Actualizado',
      'order:deleted': 'Pedido Eliminado',
      'payment:confirmed': 'Pago Confirmado',
      'stock:low': 'Stock Bajo',
      'stock:updated': 'Stock Actualizado',
      'alert:new': 'Nueva Alerta',
      'alert:deleted': 'Alerta Eliminada',
      'review:new': 'Nueva Reseña',
      'review:deleted': 'Reseña Eliminada',
      'return:new': 'Nueva Devolución',
      'return:status:updated': 'Estado de Devolución Actualizado',
      'metrics:update': 'Métricas Actualizadas',
      'product:created': 'Producto Creado',
      'product:updated': 'Producto Actualizado',
      'product:deleted': 'Producto Eliminado',
      'client:created': 'Cliente Creado',
      'client:updated': 'Cliente Actualizado',
      'client:deleted': 'Cliente Eliminado',
      'user:new': 'Nuevo Usuario',
      'invoice:created': 'Factura Creada',
      'invoice:deleted': 'Factura Eliminada',
      'category:created': 'Categoría Creada',
      'category:updated': 'Categoría Actualizada',
      'category:deleted': 'Categoría Eliminada',
      'coupon:created': 'Cupón Creado',
      'coupon:updated': 'Cupón Actualizado',
      'coupon:deleted': 'Cupón Eliminado',
      'faq:created': 'FAQ Creada',
      'faq:updated': 'FAQ Actualizada',
      'faq:deleted': 'FAQ Eliminada',
      'shipping:created': 'Zona de Envío Creada',
      'shipping:updated': 'Zona de Envío Actualizada',
      'shipping:deleted': 'Zona de Envío Eliminada',
    };

    const notification = {
      id,
      type: (event.type.includes('deleted') || event.type.includes('failed')
        ? 'error'
        : event.type.includes('updated')
          ? 'info'
          : event.type.includes('created') || event.type.includes('new')
            ? 'success'
            : 'info') as 'info' | 'success' | 'warning' | 'error',
      title: titles[event.type] || 'Notificación',
      message: getNotificationMessage(event),
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    const filterOutNotification = (n: typeof notification) => n.id !== id;
    const removeNotificationById = () => {
      setNotifications(prev => prev.filter(filterOutNotification));
    };
    setTimeout(removeNotificationById, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
    case 'order:new':
      return `Nuevo pedido #${event.payload.orderNumber} por €${event.payload.total}`;
    case 'order:status:updated':
      return `Pedido #${event.payload.orderId} cambió a ${event.payload.status}`;
    case 'payment:confirmed':
      return `Pago confirmado para pedido #${event.payload.orderId}`;
    case 'stock:low':
      return `Producto con stock bajo: ${event.payload.productName}`;
    case 'stock:updated':
      return `Stock actualizado: ${event.payload.productName}`;
    case 'alert:new':
      return `Nueva alerta: ${event.payload.alertTitle}`;
    case 'review:new':
      return `Nueva reseña de ${event.payload.rating} estrellas`;
    case 'return:new':
      return `Nueva devolución para pedido #${event.payload.orderNumber}`;
    case 'return:status:updated':
      return `Devolución #${event.payload.returnId} cambió a ${event.payload.status}`;
    case 'metrics:update':
      return 'Métricas del dashboard actualizadas';
    default:
      return 'Nueva actualización recibida';
  }
}
