/**
 * API Route - Create PayPal Payment
 * POST /api/payments/paypal/create
 * Creates a PayPal order for payment and stores paypalOrderId
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

/**
 * Get PayPal OAuth access token
 */
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
    const errorData = await response.text();
    console.error('PayPal token error:', errorData);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal order via API
 */
async function createPayPalOrder(
  accessToken: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }
): Promise<{ id: string; links: Array<{ rel: string; href: string }> }> {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderData.orderId,
        description: `Pedido ${orderData.orderNumber}`,
        amount: {
          currency_code: 'EUR',
          value: orderData.total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'EUR',
              value: orderData.total.toFixed(2),
            },
          },
        },
        items: orderData.items.map(item => ({
          name: item.name.substring(0, 127), // PayPal limit
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: 'EUR',
            value: item.unitPrice.toFixed(2),
          },
        })),
      }],
      application_context: {
        brand_name: '3D Print',
        landing_page: 'NO_PREFERENCE',
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
    throw new Error('Failed to create PayPal order');
  }

  return response.json();
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: translateErrorMessage('Missing required fields') },
        { status: 400 }
      );
    }

    // 3. Get order data with verification
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true },
        },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: translateErrorMessage('Pedido not found') },
        { status: 404 }
      );
    }

    // Verify order belongs to authenticated user
    if (order.user.email !== session.user.email) {
      return NextResponse.json(
        { error: translateErrorMessage('No autorizado') },
        { status: 403 }
      );
    }

    // 4. Get PayPal access token (OAuth)
    const accessToken = await getPayPalAccessToken();

    // 5. Create PayPal order
    const paypalOrder = await createPayPalOrder(accessToken, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
      })),
    });

    // 6. Update payment with paypalOrderId
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paypalOrderId: paypalOrder.id,
        status: 'PROCESSING',
      },
    });

    // Also update order with paypalOrderId for reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paypalOrderId: paypalOrder.id,
      },
    });

    // 7. Get approval URL from PayPal response
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');
    const paypalApprovalUrl = approvalLink?.href;

    if (!paypalApprovalUrl) {
      throw new Error('No approval URL found in PayPal response');
    }

    // 8. Return success with approval URL
    return NextResponse.json({
      success: true,
      url: paypalApprovalUrl,
      paypalOrderId: paypalOrder.id,
    });

  } catch (error) {
    console.error('Error creating PayPal payment:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';

    return NextResponse.json(
      { error: translateErrorMessage(errorMessage) },
      { status: 500 }
    );
  }
}
