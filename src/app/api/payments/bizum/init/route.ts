/**
 * API Route - Bizum Payment Initiation (Fake)
 * POST /api/payments/bizum/init
 * Simulates Bizum payment initialization without real bank integration
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * Generates a fake Bizum reference token
 * Format: BZM-XXXX-XXXX (where X is alphanumeric)
 */
function generateBizumReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `BZM-${segment()}-${segment()}`;
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

    // Generate fake Bizum reference
    const reference = generateBizumReference();

    // Calculate expiration (15 minutes from now, typical Bizum window)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Update payment with Bizum reference in metadata (using stripeSessionId field as generic reference storage)
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PROCESSING',
        stripeSessionId: reference, // Using stripeSessionId field to store the Bizum reference
      },
    });

    return NextResponse.json({
      success: true,
      reference,
      expiresAt: expiresAt.toISOString(),
      message: 'Inicie el pago en su app de Bizum usando la referencia proporcionada',
    });
  } catch (error) {
    console.error('Error initializing Bizum payment:', error);
    return NextResponse.json(
      { error: 'Error al inicializar el pago de Bizum' },
      { status: 500 }
    );
  }
}
