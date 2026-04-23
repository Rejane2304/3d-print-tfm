import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { Server as SocketIOServer } from 'socket.io';
import { EventEmitter } from 'events';

// Extend global to include Socket.IO server instance
declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export type EventType =
  | 'order:new'
  | 'order:status:updated'
  | 'payment:confirmed'
  | 'stock:low'
  | 'stock:updated'
  | 'stock:alert'
  | 'alert:new'
  | 'review:new'
  | 'metrics:update'
  | 'return:status:updated'
  // Eventos de conexión SSE
  | 'connection:established'
  | 'heartbeat';

export interface EventPayload {
  [key: string]: unknown;
}

// Interface for EventStore record from Prisma
interface EventStoreRecord {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  room: string;
  userId: string | null;
  timestamp: Date;
  delivered: boolean;
  deliveredAt: Date | null;
  expiresAt: Date;
}

// Tipo para handlers de eventos SSE
export type EventHandler = (event: { type: string; data: unknown }) => void;

/**
 * Servicio centralizado de eventos en tiempo real
 *
 * Combina:
 * - Almacenamiento persistente en BD (EventStore)
 * - Emisión vía Socket.IO (si está disponible)
 * - SSE mediante EventEmitter interno
 */
class EventService extends EventEmitter {
  private subscribers: Map<string, Set<EventHandler>> = new Map();

  constructor() {
    super();
    this.setMaxListeners(1000); // Permitir muchos listeners para SSE
  }

  /**
   * Suscribe un handler para recibir eventos en tiempo real (SSE)
   * @param userId - ID del usuario
   * @param handler - Función callback que recibe los eventos
   */
  subscribe(userId: string, handler: EventHandler): void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(handler);

    // También escuchar en el EventEmitter global
    this.on(`event:${userId}`, handler as (event: unknown) => void);

    logger.debug(`[SSE] Usuario suscrito: ${userId}`);
  }

  /**
   * Desuscribe un handler de eventos
   * @param userId - ID del usuario
   * @param handler - Handler a remover
   */
  unsubscribe(userId: string, handler: EventHandler): void {
    const userHandlers = this.subscribers.get(userId);
    if (userHandlers) {
      userHandlers.delete(handler);
      if (userHandlers.size === 0) {
        this.subscribers.delete(userId);
      }
    }

    this.off(`event:${userId}`, handler as (event: unknown) => void);

    logger.debug(`[SSE] Usuario desuscrito: ${userId}`);
  }

  /**
   * Emite un evento a todos los suscriptores
   * @param event - Tipo de evento
   * @param data - Datos del evento
   * @param userId - ID de usuario específico (opcional)
   * @param room - Sala/room (opcional, para compatibilidad)
   */
  broadcast(event: string, data: unknown, userId?: string, room?: string): void {
    const eventData = { type: event, data, timestamp: new Date().toISOString() };

    // Emitir a usuario específico
    if (userId) {
      this.emit(`event:${userId}`, eventData);

      const handlers = this.subscribers.get(userId);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(eventData);
          } catch (error) {
            logger.error(`[SSE] Error en handler para ${userId}:`, error);
          }
        });
      }
    }

    // Emitir a room (todos los usuarios de admin)
    if (room) {
      this.emit(`event:room:${room}`, eventData);

      // Si es room admin, emitir a todos los admins
      if (room === 'admin') {
        this.subscribers.forEach((handlers, uid) => {
          // En producción, verificar si el usuario es admin
          handlers.forEach(handler => {
            try {
              handler(eventData);
            } catch (error) {
              logger.error(`[SSE] Error en handler para ${uid}:`, error);
            }
          });
        });
      }
    }

    // También emitir globalmente
    this.emit('event:global', eventData);
  }
}

// Exportar instancia singleton
export const eventService = new EventService();

export async function emitEvent(type: EventType, payload: EventPayload, room: string, userId?: string): Promise<void> {
  try {
    // Store event in database - serialize payload properly
    const serializedPayload = structuredClone(payload) as Prisma.InputJsonValue;
    await prisma.eventStore.create({
      data: {
        id: crypto.randomUUID(),
        type,
        payload: serializedPayload,
        room,
        userId: userId || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        delivered: false,
      },
    });

    // Emitir via EventService (SSE)
    eventService.broadcast(type, payload, userId, room);

    // Also emit to any connected WebSocket clients (if server-side)
    // This will be handled by the socket.io server
     
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { io?: unknown }).io) {
       
      const io = (
        globalThis as unknown as {
          io: {
            to: (room: string) => {
              emit: (type: string, payload: EventPayload) => void;
            };
          };
        }
      ).io;
      io.to(room).emit(type, payload);
    }
  } catch (error) {
    logger.error('Error emitting event:', error);
    throw error;
  }
}

export async function getPendingEvents(
  userId: string,
  userRole?: string,
): Promise<Array<{ id: string; type: string; payload: EventPayload; timestamp: Date }>> {
  const rooms = [`user:${userId}`];
  if (userRole === 'ADMIN') {
    rooms.push('admin');
  }

  const events = (await prisma.eventStore.findMany({
    where: {
      room: { in: rooms },
      delivered: false,
    },
    orderBy: { timestamp: 'asc' },
    take: 100,
  })) as EventStoreRecord[];

  return events.map((e: EventStoreRecord) => ({
    id: e.id,
    type: e.type,
    payload: e.payload as EventPayload,
    timestamp: e.timestamp,
  }));
}

export async function markEventsAsDelivered(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) {
    return;
  }

  await prisma.eventStore.updateMany({
    where: {
      id: { in: eventIds },
    },
    data: {
      delivered: true,
      deliveredAt: new Date(),
    },
  });
}

// Specific event emitters
export async function emitNewOrder(order: unknown): Promise<void> {
  await emitEvent('order:new', { order }, 'admin');
}

export async function emitOrderStatusUpdated(
  orderId: string,
  status: string,
  userId: string,
  orderNumber?: string,
): Promise<void> {
  await emitEvent(
    'order:status:updated',
    { orderId, status, orderNumber, userId, timestamp: new Date().toISOString() },
    `user:${userId}`,
    userId,
  );
}

export async function emitPaymentConfirmed(
  orderId: string,
  payment: unknown,
  userId: string,
  orderNumber?: string,
): Promise<void> {
  await emitEvent(
    'payment:confirmed',
    { orderId, payment, orderNumber, userId, timestamp: new Date().toISOString() },
    `user:${userId}`,
    userId,
  );
  await emitEvent('payment:confirmed', { orderId, payment, orderNumber }, 'admin');
}

export async function emitStockLow(productId: string, stock: number, alert?: unknown): Promise<void> {
  await emitEvent('stock:low', { productId, stock, timestamp: new Date().toISOString() }, 'admin');

  // Si se proporciona una alerta, emitir también el evento stock:alert
  if (alert) {
    await emitEvent('stock:alert', { alert, timestamp: new Date().toISOString() }, 'admin');
  }
}

export async function emitStockUpdated(
  productId: string,
  newStock: number,
  previousStock: number,
  productName?: string,
): Promise<void> {
  await emitEvent(
    'stock:updated',
    {
      productId,
      newStock,
      previousStock,
      productName,
      timestamp: new Date().toISOString(),
    },
    'admin',
  );
  await emitEvent(
    'stock:updated',
    {
      productId,
      newStock,
      previousStock,
      productName,
      timestamp: new Date().toISOString(),
    },
    `product:${productId}`,
  );
}

export async function emitNewAlert(alert: unknown): Promise<void> {
  await emitEvent('alert:new', { alert, timestamp: new Date().toISOString() }, 'admin');
}

export async function emitNewReview(review: unknown, productId: string): Promise<void> {
  await emitEvent('review:new', { review, productId, timestamp: new Date().toISOString() }, 'admin');
}

export async function emitReturnStatusUpdated(returnId: string, status: string, userId: string): Promise<void> {
  await emitEvent(
    'return:status:updated',
    { returnId, status, timestamp: new Date().toISOString() },
    `user:${userId}`,
    userId,
  );
}

export async function emitMetricsUpdate(metrics: unknown): Promise<void> {
  await emitEvent('metrics:update', { metrics, timestamp: new Date().toISOString() }, 'admin');
}
