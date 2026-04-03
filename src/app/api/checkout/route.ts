/**
 * API Route para Checkout con Stripe
 * 
 * POST /api/checkout - Crear sesión de checkout
 * 
 * Requiere autenticación y carrito con items
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import Stripe from 'stripe';

// Inicializar Stripe (modo test)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// POST /api/checkout - Crear sesión de checkout
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Verificar autenticación
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Obtener datos del body
  const body = await req.json();
  const { shippingAddressId } = body;

  if (!shippingAddressId) {
    return NextResponse.json(
      { success: false, error: 'Dirección de envío requerida' },
      { status: 400 }
    );
  }

  // Buscar usuario con carrito
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      cart: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  // Verificar que tiene carrito con items
  if (!user.cart || user.cart.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'El carrito está vacío' },
      { status: 400 }
    );
  }

  // Verificar stock disponible
  for (const item of user.cart.items) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, error: `Stock insuficiente para ${item.product.name}` },
        { status: 400 }
      );
    }
  }

  // Calcular totales
  const subtotal = Number(user.cart.subtotal);
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shippingCost;

  try {
    // Crear line items para Stripe
    const lineItems = user.cart.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.product.name,
          description: `Producto ID: ${item.product.id}`,
        },
        unit_amount: Math.round(Number(item.unitPrice) * 100), // Stripe usa céntimos
      },
      quantity: item.quantity,
    }));

    // Añadir envío si aplica
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envío',
            description: 'Gastos de envío',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Crear sesión de Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      metadata: {
        userId: user.id,
        cartId: user.cart.id,
        shippingAddressId,
      },
    });

    // Obtener dirección de envío
    const address = await prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Dirección de envío no encontrada' },
        { status: 404 }
      );
    }

    // Generar número de pedido
    const year = new Date().getFullYear();
    const count = await prisma.order.count();
    const orderNumber = `P-${year}${String(count + 1).padStart(6, '0')}`;

    // Crear pedido en estado PENDIENTE
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PENDING',
        subtotal,
        shipping: shippingCost,
        total,
        shippingAddressId,
        shippingName: address.name,
        shippingPhone: address.phone,
        shippingAddress: address.address,
        shippingComplement: address.complement,
        shippingPostalCode: address.postalCode,
        shippingCity: address.city,
        shippingProvince: address.province,
        shippingCountry: address.country,
        stripeSessionId: stripeSession.id,
        items: {
          create: user.cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            subtotal: Number(item.unitPrice) * item.quantity,
            name: item.product.name,
            category: item.product.category?.name || 'Sin categoría',
            material: item.product.material,
          })),
        },
      },
    });

    // Vaciar carrito (opcional - lo vaciamos después del pago exitoso)
    // Por ahora dejamos el carrito intacto hasta confirmar el pago

    return NextResponse.json({
      success: true,
      sessionId: stripeSession.id,
      url: stripeSession.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
});
