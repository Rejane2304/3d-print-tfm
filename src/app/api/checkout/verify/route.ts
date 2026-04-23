export const dynamic = 'force-dynamic';

/**
 * API Route para verificar estado de checkout
 *
 * GET /api/checkout/verify?session_id=xxx
 * Verifica el estado del pago con Stripe
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import Stripe from 'stripe';
import { translateOrderStatus, translatePaymentStatus } from '@/lib/i18n';
import type { Order, OrderItem, Prisma } from '@prisma/client';

// Tipo para el pedido incluyendo items y producto
 
type OrderWithItems = Order & {
  items: (OrderItem & {
    product: {
      name: string;
      slug: string;
      images: { url: string }[];
    } | null;
  })[];
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

/**
 * Verifica la autenticación del usuario
 * @returns El email del usuario o null si no está autenticado
 */
async function verifyAuthentication(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email || null;
}

/**
 * Verifica el estado del pago con Stripe
 * @param sessionId - ID de la sesión de Stripe
 * @returns El estado del pago de Stripe o null si hay error
 */
async function verifyStripePayment(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

/**
 * Busca el pedido asociado a una sesión de Stripe
 * @param sessionId - ID de la sesión de Stripe
 * @returns El pedido encontrado o null
 */
async function findOrderBySession(sessionId: string) {
  return prisma.order.findFirst({
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
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Crea un registro de pago si no existe
 * @param order - Pedido al que se asocia el pago
 * @param stripePaymentIntentId - ID del payment intent de Stripe
 */
async function createPaymentIfNotExists(
  order: { id: string; userId: string; total: Prisma.Decimal },
  stripePaymentIntentId: string,
): Promise<void> {
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
        method: 'CARD',
        stripePaymentIntentId,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Vacía el carrito del usuario
 * @param userEmail - Email del usuario
 */
async function clearUserCart(userEmail: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { cart: true },
  });

  if (user?.cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: user.cart.id },
    });
  }
}

/**
 * Actualiza el estado del pedido a confirmado y crea el pago
 * @param order - Pedido a actualizar
 * @param stripePaymentIntentId - ID del payment intent de Stripe
 * @param userEmail - Email del usuario para vaciar el carrito
 */
async function updateOrderStatus(
  order: OrderWithItems,
  stripePaymentIntentId: string,
  userEmail: string,
): Promise<void> {
  if (order.status !== 'PENDING') {
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  await createPaymentIfNotExists(order, stripePaymentIntentId);
  await clearUserCart(userEmail);
}

/**
 * Construye la respuesta exitosa del pedido confirmado
 * @param order - Pedido confirmado
 */
function buildSuccessResponse(order: OrderWithItems) {
  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: translateOrderStatus('CONFIRMED'),
      paymentStatus: translatePaymentStatus('COMPLETED'),
      items: order.items,
    },
  });
}

/**
 * Construye la respuesta de pago pendiente o fallido
 * @param paymentStatus - Estado del pago de Stripe
 */
function buildPendingResponse(paymentStatus: string) {
  return NextResponse.json({
    success: false,
    status: translatePaymentStatus(paymentStatus),
  });
}

export async function GET(req: NextRequest) {
  try {
    const userEmail = await verifyAuthentication();

    if (!userEmail) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'El ID de sesión es requerido' }, { status: 400 });
    }

    const stripeSession = await verifyStripePayment(sessionId);

    if (!stripeSession) {
      return NextResponse.json({ error: 'Error al verificar sesión de pago' }, { status: 500 });
    }

    if (stripeSession.payment_status !== 'paid') {
      return buildPendingResponse(stripeSession.payment_status);
    }

    const order = await findOrderBySession(sessionId);

    if (!order) {
      return buildPendingResponse(stripeSession.payment_status);
    }

    await updateOrderStatus(order, stripeSession.payment_intent as string, userEmail);

    return buildSuccessResponse(order);
  } catch (error) {
    console.error('Error verifying checkout:', error);
    return NextResponse.json({ error: 'Error al verificar pago' }, { status: 500 });
  }
}
