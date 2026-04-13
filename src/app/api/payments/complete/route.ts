/**
 * API Route - Complete Payment (Fake methods)
 * POST /api/payments/complete
 *
 * Marks a fake payment (Bizum/Transfer) as COMPLETED
 * Used by the processing page after the simulated delay
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // Update payment to COMPLETED
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update order to CONFIRMED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pago completado exitosamente',
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json(
      { success: false, error: 'Error al completar el pago' },
      { status: 500 },
    );
  }
}
