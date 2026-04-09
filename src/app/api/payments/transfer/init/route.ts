/**
 * API Route - Transfer Payment Initiation (Fake)
 * POST /api/payments/transfer/init
 * Simulates bank transfer payment initialization with fake bank details
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * Generates a unique transfer reference
 * Format: TRF-{timestamp}-{random}
 */
function generateTransferReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRF-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, paymentId } = body;

    // Validate required fields
    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: 'El ID de pedido y el ID de pago son requeridos' },
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

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verify payment exists and belongs to user
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        orderId: orderId,
        userId: user.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Generate unique transfer reference
    const reference = generateTransferReference();

    // Update payment with transfer reference and mark as processing
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PROCESSING',
        stripeSessionId: reference, // Using stripeSessionId field to store the transfer reference
      },
    });

    // Return fake bank details and reference
    return NextResponse.json({
      success: true,
      reference,
      bankDetails: {
        iban: 'ES00 0000 0000 0000 0000 0000',
        beneficiary: '3D Print TFM',
        concept: reference,
      },
      amount: order.total.toString(),
      message: 'Realice la transferencia usando los datos bancarios proporcionados. El pedido se procesará una vez confirmado el pago.',
    });
  } catch (error) {
    console.error('Error initializing transfer payment:', error);
    return NextResponse.json(
      { error: 'Error al inicializar el pago por transferencia' },
      { status: 500 }
    );
  }
}
