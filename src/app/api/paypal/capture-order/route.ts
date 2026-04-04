/**
 * API Route - Capture PayPal Order
 * POST /api/paypal/capture-order
 * Captures payment after user approves
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

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
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture error:', errorData);
      throw new Error('Error capturing PayPal payment');
    }

    const captureData = await captureResponse.json();

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        paypalCaptureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
        paymentMethod: 'PAYPAL',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: orderId,
        userId: (await prisma.user.findUnique({ 
          where: { email: session.user.email },
          select: { id: true }
        }))?.id || '',
        amount: captureData.purchase_units[0]?.amount?.value,
        status: 'COMPLETED',
        method: 'PAYPAL',
        provider: 'paypal',
        paypalOrderId: paypalOrderId,
        paypalCaptureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
        processedAt: new Date(),
      },
    });

    // Clear cart
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: true },
    });

    if (user?.cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: user.cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
      status: captureData.status,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Error al procesar pago de PayPal' },
      { status: 500 }
    );
  }
}
