/**
 * Alert Service
 * Manages automatic creation of system alerts
 */
import { prisma } from '@/lib/db/prisma';
import type { AlertSeverity, AlertType } from '@prisma/client';
import { getLowStockThreshold } from '@/lib/site-config';
import { emitNewAlert } from '@/lib/realtime/event-service';
import { translateOrderStatus } from '@/lib/i18n';

interface AlertConfig {
  lowStockThreshold: number;
  criticalStockThreshold: number;
}

/**
 * Load alert configuration from the database
 */
export async function getAlertConfig(): Promise<AlertConfig> {
  const lowStockThreshold = await getLowStockThreshold();
  return {
    lowStockThreshold,
    criticalStockThreshold: Math.max(1, Math.floor(lowStockThreshold / 2)),
  };
}

// Determine severity and type based on stock level
function determineStockAlertSeverity(
  currentStock: number,
  minStock: number,
): { severity: AlertSeverity; type: AlertType } | null {
  if (currentStock === 0) {
    return { severity: 'CRITICAL', type: 'OUT_OF_STOCK' };
  }
  if (currentStock <= 2) {
    return { severity: 'HIGH', type: 'LOW_STOCK' };
  }
  if (currentStock <= minStock) {
    return { severity: 'MEDIUM', type: 'LOW_STOCK' };
  }
  return null;
}

/**
 * Create a low stock alert for a product
 */
export async function createStockAlert(productId: string, currentStock: number, minStock: number = 5) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product) {
    return null;
  }

  // Determine severity and type
  const alertConfig = determineStockAlertSeverity(currentStock, minStock);
  if (!alertConfig) {
    return null;
  }
  const { severity, type } = alertConfig;

  // Check if there's already a pending alert for this product
  const existingAlert = await prisma.alert.findFirst({
    where: {
      productId,
      type,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (existingAlert) {
    // Update the existing alert if stock changed significantly
    if (existingAlert.message !== `${product.name} tiene stock bajo (${currentStock} unidades)`) {
      return await prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          severity,
          title: type === 'OUT_OF_STOCK' ? 'Stock Agotado' : 'Stock Bajo',
          message: `${product.name} tiene ${type === 'OUT_OF_STOCK' ? 'stock agotado' : 'stock bajo'} (${currentStock} unidades)`,
        },
      });
    }
    return existingAlert;
  }

  // Create new alert
  const alert = await prisma.alert.create({
    data: {
      id: crypto.randomUUID(),
      type,
      severity,
      title: type === 'OUT_OF_STOCK' ? 'Stock Agotado' : 'Stock Bajo',
      message: `${product.name} tiene ${type === 'OUT_OF_STOCK' ? 'stock agotado' : 'stock bajo'} (${currentStock} unidades)`,
      product: { connect: { id: productId } },
      status: 'PENDING',
    },
  });

  return alert;
}

/**
 * Check and create alerts for all products with low stock
 */
export async function checkAllStockAlerts(config?: AlertConfig) {
  // Load config from DB if not provided
  const alertConfig = config || (await getAlertConfig());

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { lte: alertConfig.lowStockThreshold },
    },
    include: { category: true },
  });

  const alerts = [];
  for (const product of products) {
    const alert = await createStockAlert(product.id, product.stock, alertConfig.lowStockThreshold);
    if (alert) {
      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Automatically resolve stock alerts when restocked
 */
export async function resolveStockAlert(productId: string, newStock: number) {
  if (newStock <= 5) {
    return;
  } // Still low stock

  const pendingAlerts = await prisma.alert.findMany({
    where: {
      productId,
      type: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  for (const alert of pendingAlerts) {
    await prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes: 'Stock repuesto automáticamente',
      },
    });
  }
}

/**
 * Create alert for unpaid orders after a certain time
 */
export async function createUnpaidOrderAlerts(hoursThreshold: number = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursThreshold);

  const unpaidOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoffDate },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
      payment: true,
    },
  });

  // Filter only those that are not paid
  const ordersNotPaid = unpaidOrders.filter(order => order.payment?.status !== 'COMPLETED');

  const alerts = [];
  for (const order of ordersNotPaid) {
    // Check if alert already exists
    const existingAlert = await prisma.alert.findFirst({
      where: {
        orderId: order.id,
        type: 'PAYMENT_FAILED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existingAlert) {
      const alert = await prisma.alert.create({
        data: {
          id: crypto.randomUUID(),
          type: 'PAYMENT_FAILED',
          severity: 'MEDIUM',
          title: 'Pedido sin Pagar',
          message: `Pedido ${order.orderNumber} de ${order.user.name || order.user.email} lleva sin pagar más de ${hoursThreshold} horas`,
          orderId: order.id,
          status: 'PENDING',
        },
      });
      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Create alert for delayed orders in shipping
 */
export async function createDelayedOrderAlerts(daysThreshold: number = 3) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  const delayedOrders = await prisma.order.findMany({
    where: {
      status: 'PREPARING',
      updatedAt: { lt: cutoffDate },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  const alerts = [];
  for (const order of delayedOrders) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        orderId: order.id,
        type: 'ORDER_DELAYED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existingAlert) {
      const alert = await prisma.alert.create({
        data: {
          id: crypto.randomUUID(),
          type: 'ORDER_DELAYED',
          severity: 'HIGH',
          title: 'Pedido Atrasado',
          message: `Pedido ${order.orderNumber} lleva más de ${daysThreshold} días en procesamiento`,
          orderId: order.id,
          status: 'PENDING',
        },
      });
      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Create alert for high value order
 */
export async function createHighValueOrderAlert(orderId: string, threshold: number = 100) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!order || Number(order.total) < threshold) {
    return null;
  }

  const existingAlert = await prisma.alert.findFirst({
    where: {
      orderId: order.id,
      type: 'HIGH_VALUE_ORDER',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (!existingAlert) {
    return await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'HIGH_VALUE_ORDER',
        severity: 'MEDIUM',
        title: 'Pedido de Alto Valor',
        message: `Pedido ${order.orderNumber} de ${Number(order.total).toFixed(2)}€ de ${order.user.name || order.user.email}`,
        orderId: order.id,
        status: 'PENDING',
      },
    });
  }

  return existingAlert;
}

/**
 * Create alert for new registered user
 */
export async function createNewUserAlert(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    return null;
  }

  // Only alert if user was created less than 1 hour ago
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  if (user.createdAt < oneHourAgo) {
    return null;
  }

  const existingAlert = await prisma.alert.findFirst({
    where: {
      userId: user.id,
      type: 'NEW_USER',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (!existingAlert) {
    return await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'NEW_USER',
        severity: 'LOW',
        title: 'Nuevo Usuario',
        message: `${user.name || user.email} se registró`,
        userId: user.id,
        status: 'PENDING',
      },
    });
  }

  return existingAlert;
}

/**
 * Create alert for coupon nearing expiration
 */
export async function createCouponExpiringAlert(couponId: string, daysThreshold: number = 3) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: {
      id: true,
      code: true,
      validUntil: true,
      usedCount: true,
      maxUses: true,
    },
  });

  if (coupon?.validUntil === undefined) {
    return null;
  }

  const daysUntilExpiry = Math.ceil((new Date(coupon.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry > daysThreshold || daysUntilExpiry < 0) {
    return null;
  }

  const existingAlert = await prisma.alert.findFirst({
    where: {
      couponId: coupon.id,
      type: 'COUPON_EXPIRING',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (!existingAlert) {
    const usageText = coupon.maxUses ? ` (${coupon.usedCount}/${coupon.maxUses} usados)` : '';
    return await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'COUPON_EXPIRING',
        severity: daysUntilExpiry <= 1 ? 'HIGH' : 'MEDIUM',
        title: 'Cupón por Expirar',
        message: `Cupón ${coupon.code} expira en ${daysUntilExpiry} día(s)${usageText}`,
        couponId: coupon.id,
        status: 'PENDING',
      },
    });
  }

  return existingAlert;
}

/**
 * Run all alert checks
 */
export async function runAllAlertChecks() {
  const config = await getAlertConfig();
  const stockAlerts = await checkAllStockAlerts(config);
  const unpaidAlerts = await createUnpaidOrderAlerts();
  const delayedAlerts = await createDelayedOrderAlerts();

  return {
    stockAlerts: stockAlerts.length,
    unpaidAlerts: unpaidAlerts.length,
    delayedAlerts: delayedAlerts.length,
    total: stockAlerts.length + unpaidAlerts.length + delayedAlerts.length,
  };
}

// ============================================================================
// INSTANT ALERT FUNCTIONS
// ============================================================================

/**
 * Create alert for new order
 */
export async function createNewOrderAlert(orderId: string, orderNumber: string, total: number) {
  try {
    // Verificar si ya existe alerta PENDING para este pedido
    const existing = await prisma.alert.findFirst({
      where: {
        orderId,
        type: 'NEW_ORDER',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      return existing;
    }

    // Obtener info del pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true } } },
    });

    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'NEW_ORDER',
        severity: 'LOW',
        title: `Nuevo Pedido #${orderNumber}`,
        message: `Pedido por ${Number(total).toFixed(2)}€ de ${order?.user?.name || 'Cliente'}`,
        orderId,
        status: 'PENDING',
      },
    });

    // Emitir evento realtime
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating new order alert:', error);
    throw error;
  }
}

/**
 * Create alert for cancelled order
 */
export async function createOrderCancelledAlert(orderId: string, orderNumber: string | null) {
  try {
    // Verificar si ya existe alerta
    const existing = await prisma.alert.findFirst({
      where: {
        orderId,
        type: 'ORDER_CANCELLED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      return existing;
    }

    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'ORDER_CANCELLED',
        severity: 'MEDIUM',
        title: `Pedido Cancelado #${orderNumber}`,
        message: 'El pedido ha sido cancelado',
        orderId,
        status: 'PENDING',
      },
    });

    // Emitir evento
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating order cancelled alert:', error);
    throw error;
  }
}

/**
 * Create alert for order status change
 */
export async function createOrderStatusChangedAlert(
  orderId: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
) {
  try {
    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'ORDER_STATUS_CHANGED',
        severity: 'LOW',
        title: `Estado Actualizado #${orderNumber}`,
        message: `De ${translateOrderStatus(oldStatus)} a ${translateOrderStatus(newStatus)}`,
        orderId,
        status: 'PENDING',
      },
    });

    // Emitir evento
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating order status changed alert:', error);
    throw error;
  }
}

/**
 * Create alert for failed payment
 */
export async function createPaymentFailedAlert(orderId: string, orderNumber: string, errorMessage: string) {
  try {
    // Verificar si ya existe alerta
    const existing = await prisma.alert.findFirst({
      where: {
        orderId,
        type: 'PAYMENT_FAILED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      return existing;
    }

    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'PAYMENT_FAILED',
        severity: 'HIGH',
        title: `Pago Fallido #${orderNumber}`,
        message: errorMessage,
        orderId,
        status: 'PENDING',
      },
    });

    // Emitir evento
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating payment failed alert:', error);
    throw error;
  }
}

/**
 * Create alert for new review
 */
export async function createNewReviewAlert(reviewId: string, rating: number, productName: string) {
  try {
    // Verificar si ya existe alerta
    const existing = await prisma.alert.findFirst({
      where: {
        reviewId,
        type: 'NEW_REVIEW',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      return existing;
    }

    // Determinar severidad
    const severity: AlertSeverity = rating <= 2 ? 'HIGH' : 'LOW';

    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'NEW_REVIEW',
        severity,
        title: `Nueva Reseña ${rating}★ - ${productName}`,
        message: `${productName} recibió una reseña de ${rating} estrellas`,
        reviewId,
        status: 'PENDING',
      },
    });

    // Emitir evento
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating new review alert:', error);
    throw error;
  }
}

/**
 * Create alert for new message
 */
export async function createNewMessageAlert(messageId: string, orderId: string, userName: string) {
  try {
    // Obtener el orderNumber del pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });

    // Verificar si ya existe alerta
    const existing = await prisma.alert.findFirst({
      where: {
        orderId,
        type: 'NEW_MESSAGE',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      return existing;
    }

    // Crear alerta
    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        type: 'NEW_MESSAGE',
        severity: 'MEDIUM',
        title: `Nuevo Mensaje de ${userName}`,
        message: `Pedido #${order?.orderNumber || 'N/A'}`,
        orderId,
        status: 'PENDING',
      },
    });

    // Emitir evento
    await emitNewAlert(alert);

    return alert;
  } catch (error) {
    console.error('Error creating new message alert:', error);
    throw error;
  }
}
