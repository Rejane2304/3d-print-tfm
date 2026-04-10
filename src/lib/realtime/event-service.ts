import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Server as SocketIOServer } from "socket.io";

// Extend global to include Socket.IO server instance
declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export type EventType =
  | "order:new"
  | "order:status:updated"
  | "payment:confirmed"
  | "stock:low"
  | "stock:updated"
  | "alert:new"
  | "review:new"
  | "metrics:update";

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

export async function emitEvent(
  type: EventType,
  payload: EventPayload,
  room: string,
  userId?: string,
): Promise<void> {
  try {
    // Store event in database - serialize payload properly
    const serializedPayload = JSON.parse(
      JSON.stringify(payload),
    ) as Prisma.InputJsonValue;
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

    // Also emit to any connected WebSocket clients (if server-side)
    // This will be handled by the socket.io server
    if (typeof global !== "undefined" && global.io) {
      const io = global.io;
      io.to(room).emit(type, payload);
    }
  } catch (error) {
    console.error("Error emitting event:", error);
    throw error;
  }
}

export async function getPendingEvents(
  userId: string,
  userRole?: string,
): Promise<
  Array<{ id: string; type: string; payload: EventPayload; timestamp: Date }>
> {
  const rooms = [`user:${userId}`];
  if (userRole === "ADMIN") {
    rooms.push("admin");
  }

  const events = (await prisma.eventStore.findMany({
    where: {
      room: { in: rooms },
      delivered: false,
    },
    orderBy: { timestamp: "asc" },
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
  if (eventIds.length === 0) return;

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
  await emitEvent("order:new", { order }, "admin");
}

export async function emitOrderStatusUpdated(
  orderId: string,
  status: string,
  userId: string,
): Promise<void> {
  await emitEvent(
    "order:status:updated",
    { orderId, status, timestamp: new Date().toISOString() },
    `user:${userId}`,
    userId,
  );
}

export async function emitPaymentConfirmed(
  orderId: string,
  payment: unknown,
  userId: string,
): Promise<void> {
  await emitEvent(
    "payment:confirmed",
    { orderId, payment, timestamp: new Date().toISOString() },
    `user:${userId}`,
    userId,
  );
  await emitEvent("payment:confirmed", { orderId, payment }, "admin");
}

export async function emitStockLow(
  productId: string,
  stock: number,
): Promise<void> {
  await emitEvent(
    "stock:low",
    { productId, stock, timestamp: new Date().toISOString() },
    "admin",
  );
}

export async function emitStockUpdated(
  productId: string,
  newStock: number,
  previousStock: number,
): Promise<void> {
  await emitEvent(
    "stock:updated",
    { productId, newStock, previousStock, timestamp: new Date().toISOString() },
    "admin",
  );
  await emitEvent(
    "stock:updated",
    { productId, newStock, previousStock, timestamp: new Date().toISOString() },
    `product:${productId}`,
  );
}

export async function emitNewAlert(alert: unknown): Promise<void> {
  await emitEvent(
    "alert:new",
    { alert, timestamp: new Date().toISOString() },
    "admin",
  );
}

export async function emitNewReview(
  review: unknown,
  productId: string,
): Promise<void> {
  await emitEvent(
    "review:new",
    { review, productId, timestamp: new Date().toISOString() },
    "admin",
  );
}

export async function emitMetricsUpdate(metrics: unknown): Promise<void> {
  await emitEvent(
    "metrics:update",
    { metrics, timestamp: new Date().toISOString() },
    "admin",
  );
}
