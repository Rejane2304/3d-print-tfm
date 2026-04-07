/**
 * API Route - Adjust Inventory (Admin)
 * POST /api/admin/inventory/[id]/adjust
 * Creates inventory movement and updates stock
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { MovementType } from '@prisma/client';
import {
  translateMovementType,
  translateErrorMessage,
} from '@/lib/i18n';
import {
  emitStockUpdated,
  emitStockLow,
} from '@/lib/realtime/event-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { type, quantity, reason } = body;

    // Validate input
    if (!type || !['IN', 'OUT', 'ADJUST'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de movimiento inválido' },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cantidad debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Motivo requerido (mínimo 3 caracteres)' },
        { status: 400 }
      );
    }

    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const previousStock = product.stock;
    let newStock: number;
    let movementType: MovementType;

    // Calculate new stock based on movement type
    switch (type) {
      case 'IN':
        newStock = previousStock + quantity;
        movementType = MovementType.IN;
        break;
      case 'OUT':
        newStock = previousStock - quantity;
        movementType = MovementType.OUT;
        break;
      case 'ADJUST':
        newStock = quantity; // In ADJUST, quantity is the new target value
        movementType = MovementType.ADJUSTMENT;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de movimiento no válido' },
          { status: 400 }
        );
    }

    // Validate stock won't go negative
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'El stock no puede ser negativo' },
        { status: 400 }
      );
    }

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create inventory movement
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: movementType,
          quantity: type === 'ADJUST' ? Math.abs(newStock - previousStock) : quantity,
          previousStock,
          newStock,
          reason,
          createdBy: adminUser.id,
        },
      });

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: newStock },
      });

      return { movement, product: updatedProduct };
    });

    // Emitir evento de stock actualizado en tiempo real
    await emitStockUpdated(
      result.product.id,
      result.product.stock,
      previousStock
    );

    // Si el stock está bajo, emitir alerta
    if (result.product.stock <= 5) {
      await emitStockLow(result.product.id, result.product.stock);
    }

    return NextResponse.json({
      success: true,
      message: translateErrorMessage('Stock actualizado correctamente'),
      data: {
        product: {
          id: result.product.id,
          name: result.product.name,
          stock: result.product.stock,
        },
        movement: {
          id: result.movement.id,
          type: translateMovementType(result.movement.type),
          previousStock: result.movement.previousStock,
          newStock: result.movement.newStock,
          quantity: result.movement.quantity,
          reason: result.movement.reason,
          createdAt: result.movement.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al ajustar inventario') },
      { status: 500 }
    );
  }
}
