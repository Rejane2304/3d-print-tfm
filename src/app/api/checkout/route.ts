/**
 * API Route for Checkout with Coupon Support
 *
 * POST /api/checkout - Create order with optional coupon discount
 *
 * Now supports: couponCode in request body
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';
import { translateErrorMessage, translatePaymentMethod } from '@/lib/i18n';
import { emitNewOrder } from '@/lib/realtime/event-service';
import { createNewOrderAlert } from '@/lib/alerts/alert-service';
import { DEFAULT_VAT_RATE, roundToCents } from '@/lib/constants/tax';

// Type for cart items with product included
type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        category: true;
      };
    };
  };
}>;

// POST /api/checkout - Create order and process payment
export const POST = withErrorHandler(async(req: NextRequest) => {
  // Verify authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 },
    );
  }

  // Get data from request body
  const body = await req.json();
  const {
    shippingAddressId,
    paymentMethod = 'CARD',
    couponCode,
  } = body;

  if (!shippingAddressId) {
    return NextResponse.json(
      { success: false, error: 'Dirección de envío requerida' },
      { status: 400 },
    );
  }

  // Validate payment method
  const validPaymentMethods = ['CARD', 'PAYPAL', 'BIZUM', 'TRANSFER'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return NextResponse.json(
      { success: false, error: 'Método de pago no válido' },
      { status: 400 },
    );
  }

  // Find user with cart
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
      { success: false, error: translateErrorMessage('Usuario not found') },
      { status: 404 },
    );
  }

  // Verify user has cart with items
  if (!user.cart || user.cart.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'El carrito está vacío' },
      { status: 400 },
    );
  }

  // Verify available stock
  for (const item of user.cart.items as CartItemWithProduct[]) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock insuficiente para ${item.product.name}`,
        },
        { status: 400 },
      );
    }
  }

  // Calculate totals
  const subtotal = Number(user.cart.subtotal);
  let couponDiscount = 0;
  let couponId: string | null = null;
  let hasFreeShipping = false;

  // Validate and apply coupon if provided
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (coupon) {
      const now = new Date();
      const isValid =
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        (coupon.minOrderAmount === null ||
          subtotal >= Number(coupon.minOrderAmount));

      if (isValid) {
        couponId = coupon.id;

        if (coupon.type === 'PERCENTAGE') {
          couponDiscount = subtotal * (Number(coupon.value) / 100);
        } else if (coupon.type === 'FIXED') {
          couponDiscount = Math.min(Number(coupon.value), subtotal);
        } else if (coupon.type === 'FREE_SHIPPING') {
          hasFreeShipping = true;
        }

        // Redondear a 2 decimales
        couponDiscount = Math.round(couponDiscount * 100) / 100;
      }
    }
  }

  // Usar tasa de IVA constante para garantizar consistencia en todos los cálculos
  const taxRate = DEFAULT_VAT_RATE;

  const shippingCost = subtotal >= 50 || hasFreeShipping ? 0 : 5.99;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  // IVA solo sobre productos (subtotal con descuento), envío sin IVA
  // const taxAmount = roundToCents(discountedSubtotal * taxRate); // Eliminado porque no se usa
  const total = roundToCents(discountedSubtotal * (1 + taxRate) + shippingCost);

  try {
    // Get shipping address
    const address = await prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: translateErrorMessage('Dirección de envío no encontrada'),
        },
        { status: 404 },
      );
    }

    // Generate order number
    const year = new Date().getFullYear();
    const count = await prisma.order.count();
    const orderNumber = `P-${year}${String(count + 1).padStart(6, '0')}`;

    // Save cart reference
    const cart = user.cart;
    const cartItems = cart.items as CartItemWithProduct[];

    // Create order and payment in a transaction
    const result = await prisma.$transaction(async(tx) => {
      // 1. Create the order as PENDING (payment will be processed separately)
      const order = await tx.order.create({
        data: {
          id: crypto.randomUUID(),
          user: { connect: { id: user.id } },
          status: 'PENDING',
          orderNumber,
          subtotal,
          shipping: shippingCost,
          discount: couponDiscount > 0 ? couponDiscount : undefined,
          total,
          shippingAddressData: shippingAddressId ? { connect: { id: shippingAddressId } } : undefined,
          shippingName: address.recipient,
          shippingPhone: address.phone,
          shippingAddress: address.address,
          shippingComplement: address.complement,
          shippingPostalCode: address.postalCode,
          shippingCity: address.city,
          shippingProvince: address.province,
          shippingCountry: address.country,
          paymentMethod: paymentMethod as
            | 'CARD'
            | 'PAYPAL'
            | 'BIZUM'
            | 'TRANSFER',
          updatedAt: new Date(),
          // Create order items from cart items
          items: {
            create: cartItems.map((item: CartItemWithProduct) => ({
              id: crypto.randomUUID(),
              product: { connect: { id: item.product.id } },
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              subtotal: new Prisma.Decimal(item.product.price).mul(
                item.quantity,
              ),
              category: item.product.category?.name || 'Uncategorized',
              material: item.product.material,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Create the payment as PENDING (will be processed by frontend)
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          order: { connect: { id: order.id } },
          user: { connect: { id: user.id } },
          amount: total,
          method: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
          status: 'PENDING',
          updatedAt: new Date(),
          // processedAt will be set when payment is completed
        },
      });

      // 3. Increment coupon usage if applicable
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 4. Deduct stock from products (reserve stock) - CON MOVIMIENTOS DE INVENTARIO
      for (const item of cartItems) {
        // Actualizar stock
        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Registrar movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            orderId: order.id,
            createdBy: user.id,
            type: 'OUT',
            quantity: item.quantity,
            previousStock: product.stock + item.quantity,
            newStock: product.stock,
            reason: `Venta - Pedido ${order.orderNumber}`,
            reference: order.id,
          },
        });
      }

      // 5. Empty the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { order, payment };
    });

    // Emit real-time event for new order
    await emitNewOrder({
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      total: Number(result.order.total),
      userName: user.name || user.email,
      timestamp: new Date().toISOString(),
    });

    // Create alert for new order
    try {
      await createNewOrderAlert(
        result.order.id,
        result.order.orderNumber,
        Number(result.order.total),
      );
    } catch (alertError) {
      console.error('Error creating new order alert:', alertError);
    }

    // Return order and payment IDs for frontend to handle payment processing
    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      paymentId: result.payment.id,
      orderNumber: result.order.orderNumber,
      status: 'PENDING',
      paymentMethod: translatePaymentMethod(paymentMethod),
      discount: couponDiscount > 0 ? couponDiscount : undefined,
      message: 'Pedido creado. Proceda al pago.',
    });
  } catch (error) {
    console.error('Error in checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: translateErrorMessage('Error al procesar el pedido'),
      },
      { status: 500 },
    );
  }
});
