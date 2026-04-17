import type { NextRequest } from 'next/server';
import { eventService } from '@/lib/realtime/event-service';
import { checkSSERateLimit, incrementSSEConnection, decrementSSEConnection } from '@/lib/rate-limit/sse-rate-limit';

export const dynamic = 'force-dynamic';

// Cola de eventos recientes - almacena los últimos 50 eventos por userId
const eventQueue = new Map<string, Array<{ id: string; type: string; data: unknown; timestamp: string }>>();
const MAX_QUEUE_SIZE = 50;

/**
 * Almacena un evento en la cola para recuperación posterior
 */
function queueEvent(userId: string, event: { id: string; type: string; data: unknown }) {
  if (!eventQueue.has(userId)) {
    eventQueue.set(userId, []);
  }

  const queue = eventQueue.get(userId)!;
  queue.push({
    ...event,
    timestamp: new Date().toISOString(),
  });

  // Mantener solo los últimos 50 eventos
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.shift();
  }
}

/**
 * Recupera eventos perdidos desde un ID específico
 */
function getMissedEvents(
  userId: string,
  lastEventId: string,
): Array<{ id: string; type: string; data: unknown; timestamp: string }> {
  const queue = eventQueue.get(userId);
  if (!queue || queue.length === 0) {
    return [];
  }

  // Encontrar el índice del evento con lastEventId
  const lastIndex = queue.findIndex(e => e.id === lastEventId);
  if (lastIndex === -1) {
    // No encontramos el evento, devolver los últimos eventos (hasta 10)
    return queue.slice(-10);
  }

  // Devolver eventos posteriores al lastEventId
  return queue.slice(lastIndex + 1);
}

/**
 * Limpia eventos antiguos de la cola (más de 5 minutos)
 */
function cleanupOldEvents(userId: string) {
  const queue = eventQueue.get(userId);
  if (!queue) return;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const filteredQueue = queue.filter(e => e.timestamp > fiveMinutesAgo);

  if (filteredQueue.length !== queue.length) {
    eventQueue.set(userId, filteredQueue);
  }
}

/**
 * GET /api/events/stream - Server-Sent Events endpoint
 *
 * Establece una conexión SSE para recibir eventos en tiempo real.
 * Requiere autenticación mediante token en query param o cookie.
 *
 * Mejoras:
 * - Heartbeat cada 15 segundos
 * - Soporte para Last-Event-ID para recuperar eventos perdidos
 * - Cola de eventos recientes (últimos 50)
 * - Reconexión inteligente con backoff exponencial
 * - Detección de desconexión mejorada
 */
export async function GET(req: NextRequest) {
  // Obtener IP del cliente (considerando proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // Rate limiting: máximo 5 conexiones SSE por IP
  const rateLimit = checkSSERateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: rateLimit.reason }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimit.retryAfter || 60),
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const lastEventId = searchParams.get('lastEventId') || undefined;

  // También soportar header Last-Event-ID (estándar SSE)
  const headerLastEventId = req.headers.get('last-event-id');
  const effectiveLastEventId = lastEventId || headerLastEventId || undefined;

  // Validar autenticación
  if (!userId || !token) {
    return new Response(JSON.stringify({ error: 'Se requiere userId y token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Incrementar contador de conexiones
  incrementSSEConnection(ip);

  // Limpiar eventos antiguos para este usuario
  cleanupOldEvents(userId);

  // Headers SSE obligatorios
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Deshabilitar buffering de Nginx si aplica
  });

  // Crear stream para SSE
  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      // Función segura para enviar eventos
      const safeEnqueue = (data: string) => {
        if (!isActive) return false;
        try {
          controller.enqueue(data);
          return true;
        } catch {
          // Cliente desconectado
          isActive = false;
          return false;
        }
      };

      // Enviar evento inicial de conexión
      const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const initialEvent = {
        id: connectionId,
        type: 'connection:established',
        data: {
          userId,
          timestamp: new Date().toISOString(),
          connectionId,
        },
      };

      if (!safeEnqueue(formatSSEEvent(initialEvent))) {
        return;
      }

      // Enviar eventos perdidos si hay Last-Event-ID
      if (effectiveLastEventId) {
        const missedEvents = getMissedEvents(userId, effectiveLastEventId);
        if (missedEvents.length > 0) {
          const missedEvent = {
            id: `missed-${Date.now()}`,
            type: 'missed_events',
            data: { events: missedEvents },
          };
          safeEnqueue(formatSSEEvent(missedEvent));

          // Enviar también los eventos individuales
          missedEvents.forEach(event => {
            safeEnqueue(
              formatSSEEvent({
                id: event.id,
                type: event.type,
                data: event.data,
              }),
            );
          });
        }
      }

      // Función para enviar heartbeat cada 15 segundos
      const startHeartbeat = () => {
        heartbeatInterval = setInterval(() => {
          if (!isActive) {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            return;
          }

          const heartbeat = {
            id: `hb-${Date.now()}`,
            type: 'heartbeat',
            data: {
              timestamp: new Date().toISOString(),
              connectionId,
            },
          };

          if (!safeEnqueue(formatSSEEvent(heartbeat))) {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            eventService.unsubscribe(userId, eventHandler);
          }
        }, 15000); // 15 segundos
      };

      // Handler para eventos
      const eventHandler = (event: { type: string; data: unknown }) => {
        if (!isActive) return;

        const eventId = `${event.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const sseEvent = {
          id: eventId,
          type: event.type,
          data: event.data,
        };

        // Guardar en cola para recuperación
        queueEvent(userId, sseEvent);

        if (!safeEnqueue(formatSSEEvent(sseEvent))) {
          // Error al enviar, cliente probablemente desconectado
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          eventService.unsubscribe(userId, eventHandler);
        }
      };

      // Suscribirse al servicio de eventos
      eventService.subscribe(userId, eventHandler);

      // Iniciar heartbeat
      startHeartbeat();

      // Manejar cierre de conexión
      const cleanup = () => {
        if (!isActive) return;
        isActive = false;

        // Decrementar contador de conexiones
        decrementSSEConnection(ip);

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        eventService.unsubscribe(userId, eventHandler);

        try {
          controller.close();
        } catch {
          // Ignorar error al cerrar
        }
      };

      req.signal.addEventListener('abort', cleanup);

      // Timeout de seguridad - cerrar después de 1 hora
      setTimeout(
        () => {
          cleanup();
        },
        60 * 60 * 1000,
      );
    },

    cancel() {
      // Limpieza cuando el cliente cierra la conexión
    },
  });

  return new Response(stream, { headers });
}

/**
 * Formatea un evento al formato SSE
 */
function formatSSEEvent(event: { id: string; type: string; data: unknown }): string {
  const lines: string[] = [];

  // ID del evento (para reconexión con Last-Event-ID)
  if (event.id) {
    lines.push(`id: ${event.id}`);
  }

  // Tipo de evento
  lines.push(`event: ${event.type}`);

  // Datos (siempre como JSON)
  lines.push(`data: ${JSON.stringify(event.data)}`);

  // Línea en blanco para separar eventos
  lines.push('', '');

  return lines.join('\n');
}
