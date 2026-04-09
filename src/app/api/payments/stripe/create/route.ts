/**
 * API Route - Create Stripe Checkout Session
 * POST /api/payments/stripe/create
 * 
 * Creates a Stripe Checkout session for order payment
 * Requires authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage, translateProductName } from '@/lib/i18n';
import Stripe from 'stripe';

// Initialize Stripe with TEST mode
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'El ID de pedido es requerido' },
        { status: 400 }
      );
    }

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Usuario not found') },
        { status: 404 }
      );
    }

    // 4. Get order data with items
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
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
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Pedido no encontrado') },
        { status: 404 }
      );
    }

    // Check if order can be paid
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'El pedido no está pendiente de pago' },
        { status: 400 }
      );
    }

    // 5. Build line items for Stripe
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => {
      // Translate product name to Spanish
      const translatedName = item.product
        ? translateProductName(item.product.slug) || item.name
        : item.name;

      // Stripe requires absolute URLs for images - convert relative to absolute
      let imageUrl: string | undefined = item.product?.images?.[0]?.url;
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: translatedName,
            description: item.description || undefined,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item if exists
    if (Number(order.shipping) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envío',
            description: 'Gastos de envío',
          },
          unit_amount: Math.round(Number(order.shipping) * 100),
        },
        quantity: 1,
      });
    }

    // 6. Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        paymentId: paymentId || '',
        userId: user.id,
        userEmail: user.email,
      },
      customer_email: user.email,
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
      },
      // Add order number to the description
      submit_type: 'pay',
    });

    // 7. Update order with stripeSessionId
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: stripeSession.id,
        paymentMethod: 'CARD',
      },
    });

    // 8. Update payment with stripeSessionId if paymentId provided
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          stripeSessionId: stripeSession.id,
          status: 'PROCESSING',
        },
      });
    }

    // 9. Return checkout URL
    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error de Stripe: ${error.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al crear sesión de pago') },
      { status: 500 }
    );
  }
}
