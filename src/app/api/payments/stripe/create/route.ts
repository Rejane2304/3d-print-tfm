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
import { createPaymentFailedAlert } from '@/lib/alerts/alert-service';
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
        { status: 401 },
      );
    }

    // 2. Get request body
    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'El ID de pedido es requerido' },
        { status: 400 },
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
        { status: 404 },
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
        {
          success: false,
          error: translateErrorMessage('Pedido no encontrado'),
        },
        { status: 404 },
      );
    }

    // Check if order can be paid
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'El pedido no está pendiente de pago' },
        { status: 400 },
      );
    }

    // 5. Build line items for Stripe with VAT separated (transparent)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Calculate totals - BASE IMPONIBLE INCLUYE ENVÍO
    const itemsTotal = order.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
    const discount = Number(order.discount || 0);
    const discountedItems = Math.max(0, itemsTotal - discount);
    const shipping = Number(order.shipping || 0);
    const vatRate = 0.21;
    const vatAmount = discountedItems * vatRate; // IVA solo sobre productos

    // Calculate discount ratio for proportional distribution
    const discountRatio = itemsTotal > 0 ? discount / itemsTotal : 0;

    // Build line items WITH discount applied proportionally
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => {
        // Translate product name to Spanish
        const translatedName = item.product
          ? translateProductName(item.product.slug) || item.name
          : item.name;

        // Stripe requires absolute URLs for images - convert relative to absolute
        let imageUrl: string | undefined = item.product?.images?.[0]?.url;
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        }

        // Apply discount proportionally to unit price
        const originalPrice = Number(item.price);
        const discountedPrice =
          Math.round(originalPrice * (1 - discountRatio) * 100) / 100;

        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: translatedName + (discount > 0 ? ' (con descuento)' : ''),
              description: item.description || undefined,
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: Math.round(discountedPrice * 100), // Convert to cents with discount
          },
          quantity: item.quantity,
        };
      });

    // Add shipping as a line item first (before VAT calculation)
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envío',
            description: 'Gastos de envío',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // VALIDACIÓN CRÍTICA: Verificar que el total calculado coincida con order.total
    const calculatedTotal = discountedItems + shipping + vatAmount;
    const orderTotal = Number(order.total);
    if (Math.abs(calculatedTotal - orderTotal) > 0.01) {
      console.error(
        `Total mismatch: calculated ${calculatedTotal}, order ${orderTotal}`,
      );
      throw new Error('El total calculado no coincide con el pedido');
    }

    // Add VAT as separate line item (transparency) - CALCULADO SOBRE (productos + envío)
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'IVA (21%)',
          description: 'Impuesto sobre el Valor Añadido',
        },
        unit_amount: Math.round(vatAmount * 100), // Convert to cents
      },
      quantity: 1,
    });

    // 6. Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?orderId=${order.id}&cancelled=true`,
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

    // Create alert for failed payment
    try {
      const body = await req.json().catch(() => ({}));
      const { orderId } = body;
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { orderNumber: true },
        });
        if (order) {
          await createPaymentFailedAlert(
            orderId,
            order.orderNumber,
            error instanceof Error ? error.message : 'Error desconocido',
          );
        }
      }
    } catch (alertError) {
      console.error('Error creating payment failed alert:', alertError);
    }

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error de Stripe: ${error.message}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: translateErrorMessage('Error al crear sesión de pago'),
      },
      { status: 500 },
    );
  }
}
