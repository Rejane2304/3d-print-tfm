/**
 * API Route - Cancel Order and Restore Stock
 * POST /api/orders/cancel-and-restore
 * Cancela un pedido pendiente y restaura el stock reservado
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID requerido' },
        { status: 400 }
      );
    }

    // Buscar el pedido
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        status: 'PENDING',
        user: { email: session.user.email }
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado o ya procesado' },
        { status: 404 }
      );
    }

    // Ejecutar en transacción: restaurar stock + cancelar pedido
    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock de cada producto
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // 2. Cancelar el pedido
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: 'Payment cancelled by user'
        }
      });

      // 3. Cancelar el pago asociado si existe
      await tx.payment.updateMany({
        where: { orderId: orderId },
        data: {
          status: 'FAILED'
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado y stock restaurado correctamente'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Error al cancelar el pedido' },
      { status: 500 }
    );
  }
}
