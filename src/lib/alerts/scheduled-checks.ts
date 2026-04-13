/**
 * Verificaciones programadas para alertas temporales
 * Se ejecutan al cargar el panel de alertas, NO cada 15 min
 */

import { AlertType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Helper para generar UUID compatible
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback manual
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, function(c) {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Verificar cupones por caducar (expiran en ≤3 días)
export async function checkExpiringCoupons() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const expiringCoupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      validUntil: {
        gte: now,
        lte: threeDaysLater,
      },
    },
  });

  for (const coupon of expiringCoupons) {
    const daysUntil = Math.ceil((coupon.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar si ya existe alerta
    const existing = await prisma.alert.findFirst({
      where: {
        couponId: coupon.id,
        type: 'COUPON_EXPIRING',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          id: generateUUID(),
          type: 'COUPON_EXPIRING',
          severity: daysUntil <= 1 ? 'HIGH' : 'MEDIUM',
          title: 'Cupón por Expirar',
          message: `Cupón ${coupon.code} expira en ${daysUntil} día(s)`,
          couponId: coupon.id,
          status: 'PENDING',
        },
      });
    }
  }
}

// Verificar pedidos en preparación >48h
export async function checkLongPreparationOrders() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: 'PREPARING',
      preparingAt: { lt: fortyEightHoursAgo },
    },
  });

  for (const order of orders) {
    const existing = await prisma.alert.findFirst({
      where: {
        orderId: order.id,
        type: 'PREPARING_ORDER',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          id: generateUUID(),
          type: 'PREPARING_ORDER',
          severity: 'MEDIUM',
          title: 'Preparación Prolongada',
          message: `Pedido ${order.orderNumber} lleva >48h en preparación`,
          orderId: order.id,
          status: 'PENDING',
        },
      });
    }
  }
}

// Verificar pedidos retrasados >3 días
export async function checkDelayedOrders() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: 'PREPARING',
      preparingAt: { lt: threeDaysAgo },
    },
  });

  for (const order of orders) {
    // Buscar alerta de ORDER_DELAYED
    const existing = await prisma.alert.findFirst({
      where: {
        orderId: order.id,
        type: 'ORDER_DELAYED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          id: generateUUID(),
          type: 'ORDER_DELAYED',
          severity: 'HIGH',
          title: 'Pedido Atrasado',
          message: `Pedido ${order.orderNumber} lleva >3 días en preparación`,
          orderId: order.id,
          status: 'PENDING',
        },
      });
    }
  }
}

// Verificar pedidos sin pagar >24h
export async function checkUnpaidOrders() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: twentyFourHoursAgo },
    },
    include: {
      payment: { select: { status: true } },
      user: { select: { name: true, email: true } },
    },
  });

  for (const order of orders) {
    // Solo si no está pagado
    if (order.payment?.status === 'COMPLETED') {
      continue;
    }

    const existing = await prisma.alert.findFirst({
      where: {
        orderId: order.id,
        type: 'PAYMENT_FAILED',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          id: generateUUID(),
          type: 'PAYMENT_FAILED',
          severity: 'HIGH',
          title: 'Pedido sin Pagar',
          message: `Pedido ${order.orderNumber} de ${order.user?.name || order.user?.email} >24h sin pagar`,
          orderId: order.id,
          status: 'PENDING',
        },
      });
    }
  }
}

// Ejecutar todas las verificaciones
export async function runAllScheduledChecks() {
  await Promise.all([
    checkExpiringCoupons(),
    checkLongPreparationOrders(),
    checkDelayedOrders(),
    checkUnpaidOrders(),
  ]);
}
