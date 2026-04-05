/**
 * API Route - Verify PayPal Payment
 * GET /api/paypal/verify?token={token}&PayerID={PayerID}
 * Verifies and completes PayPal payment after user returns
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus, translatePaymentMethod } from '@/lib/i18n';

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de PayPal no proporcionado' },
        { status: 400 }
      );
    }

    // Find order by PayPal order ID (token)
    const order = await prisma.order.findFirst({
      where: {
        paypalOrderId: token,
        user: {
          email: session.user.email,
        },
      },
      include: {
        payment: true,
        user: {
          select: { id: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // If order is already confirmed/paid, return success
    if (order.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        pedido: {
          orderNumber: order.orderNumber,
          total: Number(order.total),
          estado: translateOrderStatus(order.status),
          paymentMethod: order.payment ? translatePaymentMethod(order.payment.method) : 'PayPal',
        },
      });
    }

    // Get PayPal order details to verify status
    const accessToken = await getPayPalAccessToken();
    
    const paypalResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${token}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!paypalResponse.ok) {
      console.error('PayPal order details error:', await paypalResponse.text());
      return NextResponse.json(
        { error: 'Error verificando orden de PayPal' },
        { status: 500 }
      );
    }

    const paypalData = await paypalResponse.json();
    
    // Check if payment is approved/captured
    if (paypalData.status === 'APPROVED' || paypalData.status === 'COMPLETED') {
      // Update order status if not already updated
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Create payment record if not exists
      if (!order.payment) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            amount: paypalData.purchase_units[0]?.amount?.value || order.total,
            status: 'COMPLETED',
            method: 'PAYPAL',
            processedAt: new Date(),
            paypalOrderId: token,
            paypalCaptureId: paypalData.purchase_units[0]?.payments?.captures?.[0]?.id,
          },
        });
      }

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
        pedido: {
          orderNumber: order.orderNumber,
          total: Number(order.total),
          estado: translateOrderStatus('CONFIRMED'),
          paymentMethod: translatePaymentMethod('PAYPAL'),
        },
      });
    }

    // Payment not yet completed
    return NextResponse.json({
      success: false,
      pedido: {
        orderNumber: order.orderNumber,
        total: Number(order.total),
        estado: translateOrderStatus(order.status),
        paymentMethod: 'PayPal',
      },
    });
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return NextResponse.json(
      { error: 'Error al verificar pago de PayPal' },
      { status: 500 }
    );
  }
}
