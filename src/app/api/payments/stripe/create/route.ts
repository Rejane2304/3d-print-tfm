/**
 * API Route - Create Stripe Checkout Session
 * POST /api/payments/stripe/create
 *
 * Creates a Stripe Checkout session for order payment
 * Requires authentication
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage, translateProductName } from '@/lib/i18n';
import { createPaymentFailedAlert } from '@/lib/alerts/alert-service';
import Stripe from 'stripe';
import type { Decimal } from '@prisma/client/runtime/library';

// Initialize Stripe with TEST mode
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
});

// Get absolute URL from relative URL
function getAbsoluteImageUrl(relativeUrl: string | undefined, baseUrl: string): string | undefined {
  if (!relativeUrl) {
    return undefined;
  }
  if (relativeUrl.startsWith('/')) {
    return `${baseUrl}${relativeUrl}`;
  }
  return relativeUrl;
}

// Build line item for a product with discount
function buildProductLineItem(
  item: {
    name: string;
    quantity: number;
    price: Decimal;
    description: string | null;
    product: { slug: string; images: { url: string }[] } | null;
  },
  discountRatio: number,
  baseUrl: string,
): Stripe.Checkout.SessionCreateParams.LineItem {
  const translatedName = item.product ? translateProductName(item.product.slug) || item.name : item.name;

  const imageUrl = getAbsoluteImageUrl(item.product?.images?.[0]?.url, baseUrl);
  const hasDiscount = discountRatio > 0;

  const originalPrice = Number(item.price);
  const discountedPrice = Math.round(originalPrice * (1 - discountRatio) * 100) / 100;

  return {
    price_data: {
      currency: 'eur',
      product_data: {
        name: translatedName + (hasDiscount ? ' (con descuento)' : ''),
        description: item.description || undefined,
        images: imageUrl ? [imageUrl] : undefined,
      },
      unit_amount: Math.round(discountedPrice * 100),
    },
    quantity: item.quantity,
  };
}

// Build shipping line item
function buildShippingLineItem(shipping: number): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Envío',
        description: 'Gastos de envío',
      },
      unit_amount: Math.round(shipping * 100),
    },
    quantity: 1,
  };
}

// Build VAT line item
function buildVatLineItem(vatAmount: number): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'IVA (21%)',
        description: 'Impuesto sobre el Valor Añadido',
      },
      unit_amount: Math.round(vatAmount * 100),
    },
    quantity: 1,
  };
}

// Calculate order totals
interface OrderTotals {
  itemsTotal: number;
  discount: number;
  discountedItems: number;
  shipping: number;
  vatAmount: number;
  calculatedTotal: number;
  discountRatio: number;
}

function calculateOrderTotals(order: {
  items: Array<{ price: Decimal; quantity: number }>;
  discount: Decimal | null;
  shipping: Decimal | null;
  total: Decimal;
}): OrderTotals {
  const itemsTotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const discount = Number(order.discount || 0);
  const discountedItems = Math.max(0, itemsTotal - discount);
  const shipping = Number(order.shipping || 0);
  const vatRate = 0.21;
  const vatAmount = discountedItems * vatRate;
  const calculatedTotal = discountedItems + shipping + vatAmount;
  const discountRatio = itemsTotal > 0 ? discount / itemsTotal : 0;

  return {
    itemsTotal,
    discount,
    discountedItems,
    shipping,
    vatAmount,
    calculatedTotal,
    discountRatio,
  };
}

// Create alert for failed payment
async function createFailedPaymentAlert(orderId: string, errorMessage: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });
    if (order) {
      await createPaymentFailedAlert(orderId, order.orderNumber, errorMessage);
    }
  } catch (alertError) {
    console.error('Error creating payment failed alert:', alertError);
  }
}

// Verify authentication and get session
type AuthResult = { success: true; email: string } | { success: false; response: NextResponse };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verifyAuthSession(req: NextRequest): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }

  return { success: true, email: session.user.email };
}

// Get user from database
type UserResult =
  | { success: true; user: { id: string; email: string; name: string | null } }
  | { success: false; response: NextResponse };

async function getUserForPayment(email: string): Promise<UserResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: translateErrorMessage('Usuario not found') },
        { status: 404 },
      ),
    };
  }

  return { success: true, user };
}

// Get order with items
type OrderResult =
  | {
      success: true;
      order: {
        id: string;
        orderNumber: string;
        status: string;
        total: Decimal;
        discount: Decimal | null;
        shipping: Decimal | null;
        items: Array<{
          name: string;
          description: string | null;
          quantity: number;
          price: Decimal;
          product: { slug: string; images: { url: string }[] } | null;
        }>;
      };
    }
  | { success: false; response: NextResponse };

async function getOrderForPayment(orderId: string, userId: string): Promise<OrderResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
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
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: translateErrorMessage('Pedido no encontrado'),
        },
        { status: 404 },
      ),
    };
  }

  if (order.status !== 'PENDING') {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'El pedido no está pendiente de pago' }, { status: 400 }),
    };
  }

  return { success: true, order };
}

// Update order and payment with session ID
async function updateOrderAndPayment(orderId: string, paymentId: string | undefined, stripeSessionId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeSessionId,
      paymentMethod: 'CARD',
    },
  });

  if (paymentId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        stripeSessionId,
        status: 'PROCESSING',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuthSession(req);
    if (!authResult.success) {
      return authResult.response;
    }

    // 2. Get request body
    const body = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'El ID de pedido es requerido' }, { status: 400 });
    }

    // 3. Get user from database
    const userResult = await getUserForPayment(authResult.email);
    if (!userResult.success) {
      return userResult.response;
    }

    // 4. Get order data with items
    const orderResult = await getOrderForPayment(orderId, userResult.user.id);
    if (!orderResult.success) {
      return orderResult.response;
    }
    const order = orderResult.order;

    // 5. Build line items for Stripe with VAT separated (transparent)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Calculate totals
    const totals = calculateOrderTotals(order);

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(item =>
      buildProductLineItem(item, totals.discountRatio, baseUrl),
    );

    // Add shipping line item
    if (totals.shipping > 0) {
      lineItems.push(buildShippingLineItem(totals.shipping));
    }

    // VALIDACIÓN CRÍTICA: Verify calculated total matches order.total
    const orderTotal = Number(order.total);
    if (Math.abs(totals.calculatedTotal - orderTotal) > 0.01) {
      console.error(`Total mismatch: calculated ${totals.calculatedTotal}, order ${orderTotal}`);
      throw new Error('El total calculado no coincide con el pedido');
    }

    // Add VAT line item
    lineItems.push(buildVatLineItem(totals.vatAmount));

    // 6. Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?orderId=${order.id}&cancelled=true`,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        paymentId: paymentId || '',
        userId: userResult.user.id,
        userEmail: userResult.user.email,
      },
      customer_email: userResult.user.email,
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          userId: userResult.user.id,
        },
      },
      submit_type: 'pay',
    });

    // 7. Update order with stripeSessionId
    await updateOrderAndPayment(order.id, paymentId, stripeSession.id);

    // 8. Return checkout URL
    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);

    // Create alert for failed payment
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;
    if (orderId) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await createFailedPaymentAlert(orderId, errorMessage);
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
