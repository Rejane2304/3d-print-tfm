/**
 * API Route - Confirm Payment (Demo Mode)
 * POST /api/checkout/confirm-payment
 * Immediately confirms payment for demo purposes
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

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
    const { orderId, paymentMethod } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID requerido' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Update order status to CONFIRMED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: orderId,
        userId: user.id,
        amount: order.total,
        status: 'COMPLETED',
        method: paymentMethod || 'STRIPE',
        processedAt: new Date(),
      },
    });

    // Clear cart
    const userWithCart = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: true },
    });

    if (userWithCart?.cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: userWithCart.cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pago confirmado',
      orderId,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Error al confirmar el pago' },
      { status: 500 }
    );
  }
}
