export const dynamic = 'force-dynamic';

/**
 * API Route para verificar estado de checkout
 * 
 * GET /api/checkout/verify?session_id=xxx
 * Verifica el estado del pago con Stripe
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import Stripe from 'stripe';
import { translateOrderStatus, translatePaymentStatus } from '@/lib/i18n';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

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
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'El ID de sesión es requerido' },
        { status: 400 }
      );
    }

    // Verificar sesión con Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status === 'paid') {
      // Buscar pedido asociado
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
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
                    select: { url: true }
                  }
                }
              }
            }
          }
        }
      });

      if (order) {
        // Actualizar estado si aún está pendiente
        if (order.status === 'PENDING') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CONFIRMED',
              confirmedAt: new Date()
            }
          });

          // Crear registro de pago (solo si no existe)
          const existingPayment = await prisma.payment.findUnique({
            where: { orderId: order.id }
          });
          
          if (!existingPayment) {
            await prisma.payment.create({
              data: {
                orderId: order.id,
                userId: order.userId,
                amount: order.total,
                status: 'COMPLETED',
                method: 'CARD',
                stripePaymentIntentId: stripeSession.payment_intent as string,
                processedAt: new Date()
              }
            });
          }

          // Vaciar carrito del usuario
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { cart: true }
          });

          if (user?.cart) {
            await prisma.cartItem.deleteMany({
              where: { cartId: user.cart.id }
            });
          }
        }

        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: translateOrderStatus('CONFIRMED'),
            paymentStatus: translatePaymentStatus('COMPLETED'),
            items: order.items
          }
        });
      }
    }

    return NextResponse.json({
      success: false,
      status: translatePaymentStatus(stripeSession.payment_status)
    });

  } catch (error) {
    console.error('Error verifying checkout:', error);
    return NextResponse.json(
      { error: 'Error al verificar pago' },
      { status: 500 }
    );
  }
}
