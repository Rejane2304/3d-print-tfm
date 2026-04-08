/**
 * API Route - Create PayPal Order
 * POST /api/paypal/create-order
 * Creates a PayPal order for payment
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

// PayPal API base URLs
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
        { error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { total, orderId } = body;

    if (!total || !orderId) {
      return NextResponse.json(
        { error: translateErrorMessage('Missing required fields') },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || order.user.email !== session.user.email) {
      return NextResponse.json(
        { error: translateErrorMessage('Pedido not found') },
        { status: 404 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: `Pedido ${order.orderNumber}`,
          amount: {
            currency_code: 'EUR',
            value: Number(total).toFixed(2),
          },
        }],
        application_context: {
          brand_name: '3D Print',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXTAUTH_URL}/checkout/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal order creation error:', errorData);
      throw new Error('Error creating PayPal order');
    }

    const paypalOrder = await response.json();

    // Store PayPal order ID in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paypalOrderId: paypalOrder.id,
      },
    });

    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de PayPal' },
      { status: 500 }
    );
  }
}
