/**
 * Expired Orders Service
 * Gestiona la cancelación automática de pedidos pendientes expirados
 * y la restauración de stock
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { emitMetricsUpdate, emitEvent } from '@/lib/realtime/event-service';
import { OrderStatus, PaymentStatus, type Prisma } from '@prisma/client';

export interface ExpiredOrderConfig {
  expirationHours: number;
  batchSize: number;
}

export interface ExpiredOrderResult {
  processed: number;
  cancelled: number;
  errors: number;
  details: Array<{
    orderId: string;
    orderNumber: string;
    status: 'cancelled' | 'error';
    itemsRestored: number;
    error?: string;
  }>;
}

// Configuración por defecto
const DEFAULT_CONFIG: ExpiredOrderConfig = {
  expirationHours: Number(process.env.ORDER_EXPIRATION_HOURS) || 24,
  batchSize: Number(process.env.EXPIRED_ORDERS_BATCH_SIZE) || 100,
};

/**
 * Busca pedidos PENDING que han expirado (creados hace más de X horas)
 */
export async function findExpiredOrders(config: Partial<ExpiredOrderConfig> = {}): Promise<
  Array<{
    id: string;
    orderNumber: string;
    userId: string;
    createdAt: Date;
    items: Array<{
      id: string;
      productId: string | null;
      quantity: number;
      name: string;
    }>;
  }>
> {
  const { expirationHours } = { ...DEFAULT_CONFIG, ...config };

  const expirationDate = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

  logger.info('Buscando pedidos expirados', {
    expirationHours,
    expirationDate: expirationDate.toISOString(),
  });

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      createdAt: {
        lt: expirationDate,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: config.batchSize || DEFAULT_CONFIG.batchSize,
  });

  logger.info(`Encontrados ${orders.length} pedidos expirados`);

  return orders;
}

/**
 * Cancela un pedido expirado y restaura su stock
 * Ejecuta todo en una transacción para garantizar atomicidad
 */
export async function cancelExpiredOrder(
  orderId: string,
  orderNumber: string,
  userId: string,
  items: Array<{
    id: string;
    productId: string | null;
    quantity: number;
    name: string;
  }>,
): Promise<{ success: boolean; itemsRestored: number; error?: string }> {
  try {
    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Restaurar stock para cada item
        for (const item of items) {
          if (item.productId) {
            // Obtener stock actual antes de actualizar
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            });

            if (!product) {
              logger.warn(`Producto no encontrado al restaurar stock`, {
                productId: item.productId,
                orderId,
              });
              continue;
            }

            const previousStock = product.stock;

            // Actualizar stock del producto
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            // Registrar movimiento de inventario IN (retorno)
            await tx.inventoryMovement.create({
              data: {
                id: crypto.randomUUID(),
                productId: item.productId,
                orderId,
                type: 'IN',
                quantity: item.quantity,
                previousStock,
                newStock: previousStock + item.quantity,
                reason: `Cancelación automática por expiración - Pedido ${orderNumber}`,
                reference: orderId,
                createdBy: userId,
              },
            });

            // Emitir evento de stock actualizado
            try {
              await emitEvent(
                'stock:updated',
                {
                  productId: item.productId,
                  previousStock,
                  newStock: previousStock + item.quantity,
                  reason: 'order_expired',
                  orderId,
                },
                'admin',
              );
            } catch (eventError) {
              logger.warn('Error emitiendo evento de stock', { eventError });
            }
          }
        }

        // Actualizar estado del pedido a CANCELLED
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: `Pedido expirado automáticamente después de ${DEFAULT_CONFIG.expirationHours} horas sin pago`,
            cancelledBy: 'system',
          },
        });

        // Actualizar estado del pago si existe
        const payment = await tx.payment.findUnique({
          where: { orderId },
        });

        if (payment && payment.status === PaymentStatus.PENDING) {
          await tx.payment.update({
            where: { orderId },
            data: {
              status: PaymentStatus.FAILED,
              errorMessage: 'Pedido expirado por falta de pago',
              updatedAt: new Date(),
            },
          });
        }
      },
      {
        // Configuración de transacción para garantizar atomicidad
        maxWait: 5000, // 5 segundos esperando
        timeout: 10000, // 10 segundos de timeout
      },
    );

    logger.info(`Pedido ${orderNumber} cancelado y stock restaurado`, {
      orderId,
      itemsRestored: items.length,
    });

    return { success: true, itemsRestored: items.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error cancelando pedido expirado ${orderNumber}`, error, {
      orderId,
    });
    return { success: false, itemsRestored: 0, error: errorMessage };
  }
}

/**
 * Procesa todos los pedidos expirados
 * Esta es la función principal que coordina todo el proceso
 */
export async function processExpiredOrders(config: Partial<ExpiredOrderConfig> = {}): Promise<ExpiredOrderResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  logger.info('Iniciando procesamiento de pedidos expirados', {
    expirationHours: fullConfig.expirationHours,
    batchSize: fullConfig.batchSize,
  });

  const result: ExpiredOrderResult = {
    processed: 0,
    cancelled: 0,
    errors: 0,
    details: [],
  };

  try {
    // Buscar pedidos expirados
    const expiredOrders = await findExpiredOrders(fullConfig);

    result.processed = expiredOrders.length;

    // Procesar cada pedido
    for (const order of expiredOrders) {
      const cancelResult = await cancelExpiredOrder(order.id, order.orderNumber, order.userId, order.items);

      if (cancelResult.success) {
        result.cancelled++;
        result.details.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: 'cancelled',
          itemsRestored: cancelResult.itemsRestored,
        });
      } else {
        result.errors++;
        result.details.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: 'error',
          itemsRestored: 0,
          error: cancelResult.error,
        });
      }
    }

    // Emitir evento de actualización de métricas
    if (result.cancelled > 0) {
      try {
        await emitMetricsUpdate({
          type: 'expired_orders_processed',
          cancelled: result.cancelled,
          errors: result.errors,
          timestamp: new Date().toISOString(),
        });
      } catch (metricsError) {
        logger.warn('Error emitiendo métricas', { metricsError });
      }
    }

    logger.info('Procesamiento de pedidos expirados completado', {
      processed: result.processed,
      cancelled: result.cancelled,
      errors: result.errors,
    });

    return result;
  } catch (error) {
    logger.error('Error en proceso de pedidos expirados', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de pedidos expirados sin procesarlos
 * Útil para monitoreo y alertas
 */
export async function getExpiredOrdersStats(): Promise<{
  expiredCount: number;
  expirationHours: number;
  oldestOrderDate: Date | null;
}> {
  const expirationHours = DEFAULT_CONFIG.expirationHours;
  const expirationDate = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

  const [count, oldestOrder] = await Promise.all([
    prisma.order.count({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: expirationDate,
        },
      },
    }),
    prisma.order.findFirst({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: expirationDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  return {
    expiredCount: count,
    expirationHours,
    oldestOrderDate: oldestOrder?.createdAt || null,
  };
}
