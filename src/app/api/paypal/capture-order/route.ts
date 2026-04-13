/**
 * API Route - Capture PayPal Order
 * POST /api/paypal/capture-order
 * Captures payment after user approves
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

const PAYPAL_API =
  process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const basicAuth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Error al obtener token de acceso de PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: translateErrorMessage('No autenticado') }, { status: 401 });
    }

    const body = await req.json();
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId || !orderId) {
      return NextResponse.json({ error: translateErrorMessage('Missing required fields') }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture error:', errorData);
      throw new Error('Error capturing PayPal payment');
    }

    const captureData = await captureResponse.json();

    // Get order with full details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { total: true, status: true },
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // Check if already processed (avoid duplicates)
    if (order.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
        status: 'ALREADY_PROCESSED',
      });
    }

    // Verify captured amount matches order total
    const capturedAmount = Number(captureData.purchase_units[0]?.amount?.value);
    const orderAmount = Number(order.total);

    if (Math.abs(capturedAmount - orderAmount) > 0.01) {
      console.error(`Amount mismatch: captured ${capturedAmount}, expected ${orderAmount}`);
      throw new Error('El monto capturado no coincide con el pedido');
    }

    const userRecord = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: true },
    });

    // Transaction for consistency
    await prisma.$transaction(async tx => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Check if payment already exists (avoid duplicates)
      const existingPayment = await tx.payment.findUnique({
        where: { orderId: orderId },
      });

      if (!existingPayment) {
        // Create payment record only if doesn't exist
        await tx.payment.create({
          data: {
            id: crypto.randomUUID(),
            order: { connect: { id: orderId } },
            user: { connect: { id: userRecord?.id || '' } },
            amount: capturedAmount,
            status: 'COMPLETED',
            method: 'PAYPAL',
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Clear cart
      if (userRecord?.cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: userRecord.cart.id },
        });
      }
    });

    return NextResponse.json({
      success: true,
      captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
      status: captureData.status,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json({ error: 'Error al procesar pago de PayPal' }, { status: 500 });
  }
}
