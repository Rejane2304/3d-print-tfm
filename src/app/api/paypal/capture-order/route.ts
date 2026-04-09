/**
 * API Route - Capture PayPal Order
 * POST /api/paypal/capture-order
 * Captures payment after user approves
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

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
    throw new Error('Error al obtener token de acceso de PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: translateErrorMessage('Missing required fields') },
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
    
    // Get order to retrieve total
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { total: true }
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Create payment record
    const userRecord = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { id: true }
    });
    
    await prisma.payment.create({
      data: {
        orderId: orderId,
        userId: userRecord?.id || '',
        amount: captureData.purchase_units[0]?.amount?.value || order?.total || 0,
        status: 'COMPLETED',
        method: 'PAYPAL',
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
