/**
 * Inventory Movement Service
 * Gestiona todos los movimientos de stock con trazabilidad completa
 */
import { prisma } from '@/lib/db/prisma';
import { createStockAlert } from '@/lib/alerts/alert-service';
import { emitStockLow } from '@/lib/realtime/event-service';

export interface MovementData {
  productId: string;
  orderId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  createdBy: string;
}

/**
 * Crea un movimiento de inventario con validación de stock
 */
export async function createInventoryMovement(data: MovementData) {
  return await prisma.$transaction(async tx => {
    // Obtener stock actual del producto
    const product = await tx.product.findUnique({
      where: { id: data.productId },
      select: { id: true, stock: true, name: true },
    });

    if (!product) {
      throw new Error(`Producto ${data.productId} no encontrado`);
    }

    const previousStock = product.stock;
    let newStock: number;

    // Calcular nuevo stock según tipo de movimiento
    switch (data.type) {
      case 'IN':
        newStock = previousStock + data.quantity;
        break;
      case 'OUT':
        newStock = previousStock - data.quantity;
        if (newStock < 0) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${previousStock}, Requerido: ${data.quantity}`,
          );
        }
        break;
      case 'ADJUSTMENT':
        newStock = data.quantity; // Cantidad directa, no delta
        if (newStock < 0) {
          throw new Error('Stock ajustado no puede ser negativo');
        }
        break;
      default:
        throw new Error(`Tipo de movimiento inválido: ${data.type}`);
    }

    // Actualizar stock del producto
    await tx.product.update({
      where: { id: data.productId },
      data: { stock: newStock },
    });

    // Crear registro de movimiento
    const movement = await tx.inventoryMovement.create({
      data: {
        id: crypto.randomUUID(),
        productId: data.productId,
        orderId: data.orderId,
        createdBy: data.createdBy,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock,
        reason: data.reason,
        reference: data.reference,
      },
    });

    return { movement, newStock };
  });
}

/**
 * Registra la salida de stock por venta (checkout)
 */
export async function recordStockOut(
  productId: string,
  quantity: number,
  orderId: string,
  orderNumber: string,
  userId: string,
) {
  return createInventoryMovement({
    productId,
    orderId,
    type: 'OUT',
    quantity,
    reason: `Venta - Pedido ${orderNumber}`,
    reference: orderId,
    createdBy: userId,
  });
}

/**
 * Regresa stock por cancelación
 */
export async function recordStockReturn(
  productId: string,
  quantity: number,
  orderId: string,
  orderNumber: string,
  userId: string,
  reason: string = 'Cancelación de pedido',
) {
  return createInventoryMovement({
    productId,
    orderId,
    type: 'IN',
    quantity,
    reason: `${reason} - Pedido ${orderNumber}`,
    reference: orderId,
    createdBy: userId,
  });
}

/**
 * Ajuste manual de stock (admin)
 */
export async function recordStockAdjustment(productId: string, newStock: number, reason: string, userId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  const delta = newStock - product.stock;

  return createInventoryMovement({
    productId,
    type: delta >= 0 ? 'IN' : 'OUT',
    quantity: Math.abs(delta),
    reason: `Ajuste manual: ${reason}`,
    createdBy: userId,
  });
}

/**
 * Verifica el stock después de un movimiento y crea alerta automáticamente si es necesario
 * Se ejecuta DESPUÉS de cualquier movimiento de inventario
 */
export async function checkAndCreateStockAlert(productId: string, newStock: number): Promise<void> {
  // Solo crear alerta si stock < 5
  const LOW_STOCK_THRESHOLD = 5;

  if (newStock >= LOW_STOCK_THRESHOLD) {
    return;
  }

  // Verificar si ya existe una alerta activa (no resuelta) para este producto
  const existingAlert = await prisma.alert.findFirst({
    where: {
      productId,
      type: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  // Si ya existe una alerta activa, no crear duplicada
  if (existingAlert) {
    return;
  }

  // Obtener el producto para traducir el nombre
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    return;
  }

  // Crear la alerta de stock bajo
  const alert = await createStockAlert(productId, newStock);

  if (alert) {
    // Emitir evento para notificación en tiempo real
    await emitStockLow(productId, newStock, alert);
  }
}

/**
 * Obtiene el historial de movimientos de un producto
 */
export async function getProductMovementHistory(productId: string, limit: number = 50) {
  return prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      order: {
        select: { orderNumber: true },
      },
      createdByUser: {
        select: { name: true, email: true },
      },
    },
  });
}

/**
 * Verifica la integridad del stock actual vs movimientos
 * Devuelve discrepancias encontradas
 */
export async function verifyStockIntegrity(productId: string): Promise<{
  productId: string;
  currentStock: number;
  calculatedStock: number;
  discrepancy: number;
  isValid: boolean;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  // Calcular stock basado en movimientos
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'asc' },
  });

  let calculatedStock = 0;
  for (const movement of movements) {
    if (movement.type === 'IN') {
      calculatedStock += movement.quantity;
    } else if (movement.type === 'OUT') {
      calculatedStock -= movement.quantity;
    } else if (movement.type === 'ADJUSTMENT') {
      calculatedStock = movement.newStock;
    }
  }

  const discrepancy = product.stock - calculatedStock;

  return {
    productId,
    currentStock: product.stock,
    calculatedStock,
    discrepancy,
    isValid: discrepancy === 0,
  };
}

/**
 * Reconciliación completa de inventario
 * Devuelve todos los productos con discrepancias
 */
export async function reconcileInventory(): Promise<
  Array<{
    productId: string;
    productName: string;
    currentStock: number;
    calculatedStock: number;
    discrepancy: number;
  }>
> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, stock: true },
  });

  const discrepancies: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    calculatedStock: number;
    discrepancy: number;
  }> = [];

  for (const product of products) {
    const verification = await verifyStockIntegrity(product.id);
    if (!verification.isValid) {
      discrepancies.push({
        productId: product.id,
        productName: product.name,
        currentStock: verification.currentStock,
        calculatedStock: verification.calculatedStock,
        discrepancy: verification.discrepancy,
      });
    }
  }

  return discrepancies;
}
