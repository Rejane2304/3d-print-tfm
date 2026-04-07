/**
 * API Route for Simplified Checkout
 * 
 * POST /api/checkout - Create order and payment in one step
 * 
 * Simplified flow: User chooses method → Confirms → Order created as CONFIRMED
 * No external redirects, no complex forms
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';
import { translatePaymentMethod, translateErrorMessage } from '@/lib/i18n';

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
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Verify authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Get data from request body
  const body = await req.json();
  const { shippingAddressId, paymentMethod = 'CARD' } = body;

  if (!shippingAddressId) {
    return NextResponse.json(
      { success: false, error: 'Dirección de envío requerida' },
      { status: 400 }
    );
  }

  // Validate payment method
  const validPaymentMethods = ['CARD', 'PAYPAL', 'BIZUM', 'TRANSFER'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return NextResponse.json(
      { success: false, error: 'Método de pago no válido' },
      { status: 400 }
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
      { status: 404 }
    );
  }

  // Verify user has cart with items
  if (!user.cart || user.cart.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'El carrito está vacío' },
      { status: 400 }
    );
  }

  // Verify available stock
  for (const item of user.cart.items as CartItemWithProduct[]) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, error: `Stock insuficiente para ${item.product.name}` },
        { status: 400 }
      );
    }
  }

  // Calculate totals (always include 21% VAT)
  const subtotal = Number(user.cart.subtotal);
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const taxRate = 0.21;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  try {
    // Get shipping address
    const address = await prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Dirección de envío no encontrada') },
        { status: 404 }
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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order as CONFIRMED (payment completed immediately)
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: 'CONFIRMED',
          orderNumber,
          subtotal,
          shipping: shippingCost,
          total,
          shippingAddressId,
          shippingName: address.recipient,
          shippingPhone: address.phone,
          shippingAddress: address.address,
          shippingComplement: address.complement,
          shippingPostalCode: address.postalCode,
          shippingCity: address.city,
          shippingProvince: address.province,
          shippingCountry: address.country,
          paymentMethod: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
          // Create order items from cart items
          items: {
            create: cartItems.map((item: CartItemWithProduct) => ({
              productId: item.product.id,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              subtotal: new Prisma.Decimal(item.product.price).mul(item.quantity),
              category: item.product.category?.name || 'Uncategorized',
              material: item.product.material,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Create the payment as COMPLETED
      await tx.payment.create({
        data: {
          orderId: order.id,
          userId: user.id,
          amount: total,
          method: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // 3. Deduct stock from products
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Empty the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
      paymentMethod: translatePaymentMethod(paymentMethod),
      message: 'Pago completado exitosamente',
    });
  } catch (error) {
    console.error('Error in checkout:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar el pedido') },
      { status: 500 }
    );
  }
});
