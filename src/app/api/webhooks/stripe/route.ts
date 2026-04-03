/**
 * Webhook de Stripe
 * Procesa eventos de Stripe para confirmar pagos
 * 
 * POST /api/webhooks/stripe
 * 
 * Eventos manejados:
 * - checkout.session.completed - Pago exitoso
 * - checkout.session.expired - Sesión expirada
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verificar firma del webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Procesar evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, carritoId } = session.metadata || {};

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  try {
    // Buscar pedido por stripeSessionId
    const pedido = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (!pedido) {
      console.error('Pedido not found for session:', session.id);
      return;
    }

    // Actualizar pedido a CONFIRMADO (estado inicial después del pago)
    await prisma.order.update({
      where: { id: pedido.id },
      data: {
        status: 'CONFIRMED',
        confirmadoEn: new Date(),
      },
    });

    // Crear registro de pago
    await prisma.payment.create({
      data: {
        pedidoId: pedido.id,
        usuarioId: userId,
        monto: pedido.total,
        metodo: 'TARJETA',
        estado: 'COMPLETADO',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : undefined,
      },
    });

    // Actualizar stock de productos
    for (const item of pedido.items) {
      await prisma.product.update({
        where: { id: item.productoId },
        data: {
          stock: {
            decrement: item.cantidad,
          },
        },
      });
    }

    // Vaciar carrito si existe
    if (carritoId) {
      await prisma.cartItem.deleteMany({
        where: { carritoId },
      });
      await prisma.cart.update({
        where: { id: carritoId },
        data: { subtotal: 0 },
      });
    }

    console.log('Payment processed successfully for pedido:', pedido.id);
  } catch (error) {
    console.error('Error processing checkout completed:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    const pedido = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (pedido && pedido.estado === 'PENDIENTE') {
      await prisma.order.update({
        where: { id: pedido.id },
        data: {
          status: 'CANCELLED',
          canceladoEn: new Date(),
          motivoCancelacion: 'Sesión de pago expirada',
        },
      });
    }
  } catch (error) {
    console.error('Error handling checkout expired:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Opcional: enviar email de notificación de pago fallido
    console.log('Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
