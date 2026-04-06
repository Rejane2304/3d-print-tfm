/**
 * Alert Service
 * Gestiona la creación automática de alertas del sistema
 */
import { prisma } from '@/lib/db/prisma';
import { AlertType, AlertSeverity, AlertStatus, OrderStatus, PaymentStatus } from '@prisma/client';

interface AlertConfig {
  lowStockThreshold: number;
  criticalStockThreshold: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  lowStockThreshold: 5,
  criticalStockThreshold: 2,
};

/**
 * Crea una alerta de stock bajo para un producto
 */
export async function createStockAlert(productId: string, currentStock: number, minStock: number = 5) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product) return null;

  // Determinar severidad y tipo
  let severity: AlertSeverity;
  let type: AlertType;

  if (currentStock === 0) {
    severity = 'CRITICAL';
    type = 'OUT_OF_STOCK';
  } else if (currentStock <= 2) {
    severity = 'HIGH';
    type = 'LOW_STOCK';
  } else if (currentStock <= minStock) {
    severity = 'MEDIUM';
    type = 'LOW_STOCK';
  } else {
    // Stock normal, no crear alerta
    return null;
  }

  // Verificar si ya existe una alerta pendiente para este producto
  const existingAlert = await prisma.alert.findFirst({
    where: {
      productId,
      type,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (existingAlert) {
    // Actualizar la alerta existente si el stock cambió significativamente
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

  // Crear nueva alerta
  const alert = await prisma.alert.create({
    data: {
      type,
      severity,
      title: type === 'OUT_OF_STOCK' ? 'Stock Agotado' : 'Stock Bajo',
      message: `${product.name} tiene ${type === 'OUT_OF_STOCK' ? 'stock agotado' : 'stock bajo'} (${currentStock} unidades)`,
      productId,
      status: 'PENDING',
    },
  });

  return alert;
}

/**
 * Verifica y crea alertas para todos los productos con stock bajo
 */
export async function checkAllStockAlerts(config: AlertConfig = DEFAULT_CONFIG) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { lte: config.lowStockThreshold },
    },
    include: { category: true },
  });

  const alerts = [];
  for (const product of products) {
    const alert = await createStockAlert(product.id, product.stock, config.lowStockThreshold);
    if (alert) alerts.push(alert);
  }

  return alerts;
}

/**
 * Resuelve automáticamente alertas de stock cuando se repone
 */
export async function resolveStockAlert(productId: string, newStock: number) {
  if (newStock <= 5) return; // Aún es stock bajo

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
 * Crea alerta para pedidos sin pagar después de cierto tiempo
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
        select: { name: true, email: true }
      },
      payment: true,
    },
  });

  // Filtrar solo los que no están pagados
  const ordersNotPaid = unpaidOrders.filter(order => 
    order.payment?.status !== 'COMPLETED'
  );

  const alerts = [];
  for (const order of ordersNotPaid) {
    // Verificar si ya existe alerta
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
 * Crea alerta para pedidos atrasados en envío
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
        select: { name: true, email: true }
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
 * Ejecuta todas las verificaciones de alertas
 */
export async function runAllAlertChecks() {
  const stockAlerts = await checkAllStockAlerts();
  const unpaidAlerts = await createUnpaidOrderAlerts();
  const delayedAlerts = await createDelayedOrderAlerts();

  return {
    stockAlerts: stockAlerts.length,
    unpaidAlerts: unpaidAlerts.length,
    delayedAlerts: delayedAlerts.length,
    total: stockAlerts.length + unpaidAlerts.length + delayedAlerts.length,
  };
}
