/**
 * Stripe Webhook
 * Processes Stripe events to confirm payments
 *
 * POST /api/webhooks/stripe
 *
 * Handled events:
 * - checkout.session.completed - Successful payment
 * - checkout.session.expired - Session expired
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';
import { translateErrorMessage } from '@/lib/i18n';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
      return NextResponse.json(
        { error: translateErrorMessage('Invalid signature') },
        { status: 400 }
      );
    }

    // Process event
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
      { error: translateErrorMessage('Webhook processing failed') },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, cartId } = session.metadata || {};

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  try {
    // Find order by stripeSessionId
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (!order) {
      console.error('Order not found for session:', session.id);
      return;
    }

    // Update order to CONFIRMED (initial status after payment)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: userId,
        amount: order.total,
        method: 'CARD',
        status: 'COMPLETED',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : undefined,
      },
    });

    // Update product stock
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Clear cart if it exists
    if (cartId) {
      await prisma.cartItem.deleteMany({
        where: { cartId },
      });
      await prisma.cart.update({
        where: { id: cartId },
        data: { subtotal: 0 },
      });
    }

    console.log('Payment processed successfully for order:', order.id);
  } catch (error) {
    console.error('Error processing checkout completed:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (order && order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: 'Sesión de pago expirada',
        },
      });
    }
  } catch (error) {
    console.error('Error handling checkout expired:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Optional: send payment failed notification email
    console.log('Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
