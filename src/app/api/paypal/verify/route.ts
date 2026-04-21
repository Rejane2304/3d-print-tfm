export const dynamic = 'force-dynamic';

/**
 * API Route para verificar estado de pago PayPal
 *
 * GET /api/paypal/verify?token=xxx&PayerID=yyy
 * Verifica el estado del pago con PayPal y actualiza el pedido
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateOrderStatus, translatePaymentStatus } from '@/lib/i18n';

// PayPal API base URLs
const PAYPAL_API =
  process.env.NODE_ENV === 'production' && !process.env.PAYPAL_SANDBOX_MODE
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas');
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paypalOrderId = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (!paypalOrderId || !payerId) {
      return NextResponse.json({ error: 'Token y PayerID son requeridos' }, { status: 400 });
    }

    // Buscar pedido asociado
    const order = await prisma.order.findFirst({
      where: {
        paypalOrderId: paypalOrderId,
        user: { email: session.user.email },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Si ya está confirmado, devolver datos
    if (order.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: translateOrderStatus(order.status),
          paymentStatus: translatePaymentStatus('COMPLETED'),
          items: order.items,
        },
      });
    }

    // Capturar el pago con PayPal
    try {
      const accessToken = await getPayPalAccessToken();

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
        // Si ya está capturado, continuar
        const alreadyCaptured = errorData.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED';
        if (!alreadyCaptured) {
          throw new Error('Error al capturar pago de PayPal');
        }
      }

      // Actualizar pedido
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Crear registro de pago (solo si no existe)
      const existingPayment = await prisma.payment.findUnique({
        where: { orderId: order.id },
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            id: crypto.randomUUID(),
            order: { connect: { id: order.id } },
            user: { connect: { id: order.userId } },
            amount: order.total,
            status: 'COMPLETED',
            method: 'PAYPAL',
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Vaciar carrito del usuario
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { cart: true },
      });

      if (user?.cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: user.cart.id },
        });
      }

      // Emitir actualización de métricas en tiempo real
      try {
        const { emitMetricsUpdate } = await import('@/lib/realtime/event-service');
        await emitMetricsUpdate({
          type: 'order:completed',
          orderId: order.id,
          total: Number(order.total),
          timestamp: new Date().toISOString(),
        });
      } catch (metricsError) {
        console.error('Error emitting metrics update:', metricsError);
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: translateOrderStatus('CONFIRMED'),
          paymentStatus: translatePaymentStatus('COMPLETED'),
          items: order.items,
        },
      });
    } catch (captureError) {
      console.error('Error capturing PayPal:', captureError);
      // Si falla la captura pero el pedido existe, devolver datos actuales
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: translateOrderStatus(order.status),
          paymentStatus: translatePaymentStatus('PENDING'),
          items: order.items,
        },
      });
    }
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return NextResponse.json({ error: 'Error al verificar pago de PayPal' }, { status: 500 });
  }
}
