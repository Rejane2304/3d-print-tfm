/**
 * API Route - Complete Payment (Fake methods)
 * POST /api/payments/complete
 *
 * Marks a fake payment (Bizum/Transfer) as COMPLETED
 * Used by the processing page after the simulated delay
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Update payment to COMPLETED
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Get order with items for stock decrement
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Decrement stock AFTER payment is confirmed
    // This prevents blocking inventory for abandoned payments
    for (const item of order.items) {
      if (item.productId) {
        // Get current stock before update
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (product) {
          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;

          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          await prisma.inventoryMovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              orderId: order.id,
              type: 'OUT',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: `Venta - Pedido ${order.orderNumber}`,
              reference: order.id,
              createdBy: user.id,
            },
          });
        }
      }
    }

    // Update order to CONFIRMED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pago completado exitosamente',
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json({ success: false, error: 'Error al completar el pago' }, { status: 500 });
  }
}
