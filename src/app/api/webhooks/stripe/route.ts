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
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';
import Stripe from 'stripe';
import { createHighValueOrderAlert, createNewOrderAlert } from '@/lib/alerts/alert-service';

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
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
      return NextResponse.json({ error: translateErrorMessage('Invalid signature') }, { status: 400 });
    }

    // Process event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.payment_failed': {
        await handlePaymentFailed();
        break;
      }

      default:
      // Unhandled event type
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: translateErrorMessage('Webhook processing failed') }, { status: 500 });
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

    // Check if order was already processed (avoid duplicates)
    if (order.status !== 'PENDING') {
      // Order already processed
      return;
    }

    // Check if payment already exists (avoid duplicates)
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (existingPayment) {
      // Update existing payment to COMPLETED
      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          status: 'COMPLETED',
          stripeSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          processedAt: new Date(),
        },
      });
    } else {
      // Create payment record only if doesn't exist
      await prisma.payment.create({
        data: {
          id: crypto.randomUUID(),
          order: { connect: { id: order.id } },
          user: { connect: { id: userId } },
          amount: order.total,
          method: 'CARD',
          status: 'COMPLETED',
          stripeSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Update order to CONFIRMED (initial status after payment)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // NOTE: Stock was already decremented when order was created in checkout
    // DO NOT decrement stock again here - this was causing double decrement
    // Stock decrement happens in /api/checkout/route.ts when order is created

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

    // Payment processed successfully for order

    // Crear alertas automáticas para el pedido
    try {
      // Alerta de nuevo pedido
      await createNewOrderAlert(order.id, order.orderNumber, Number(order.total));

      // Alerta de pedido de alto valor (≥100€)
      await createHighValueOrderAlert(order.id, 100);
    } catch (alertError) {
      console.error('Error creating order alerts:', alertError);
      // No fallar el webhook si la alerta falla
    }
  } catch (error) {
    console.error('Error processing checkout completed:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  try {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (order?.status === 'PENDING') {
      await prisma.$transaction(async tx => {
        // Restore stock for all items AND register inventory movement
        for (const item of order.items) {
          if (item.productId) {
            const product = await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            // Register inventory movement IN (return)
            await tx.inventoryMovement.create({
              data: {
                id: crypto.randomUUID(),
                productId: item.productId,
                orderId: order.id,
                createdBy: order.userId, // Use order's user as reference
                type: 'IN',
                quantity: item.quantity,
                previousStock: product.stock - item.quantity,
                newStock: product.stock,
                reason: `Expiración de sesión Stripe - ${order.orderNumber}`,
                reference: order.id,
              },
            });

            // Stock restored for product
          }
        }

        // Cancel order
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: 'Sesión de pago expirada',
          },
        });
      });

      // Order cancelled and stock restored for expired session
    }
  } catch (error) {
    console.error('Error handling checkout expired:', error);
    throw error;
  }
}

async function handlePaymentFailed() {
  try {
    // Optional: send payment failed notification email
    // Payment failed
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
