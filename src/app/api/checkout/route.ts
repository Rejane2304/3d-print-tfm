/**
 * API Route for Simplified Checkout
 * 
 * POST /api/checkout - Create order and payment in one step
 * 
 * Flujo simplificado: Usuario elige método → Confirma → Pedido creado como CONFIRMED
 * No redirecciones externas, no formularios complejos
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

  // Verificar stock disponible
  for (const item of user.cart.items as CartItemWithProduct[]) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, error: `Stock insuficiente para ${item.product.name}` },
        { status: 400 }
      );
    }
  }

  // Calcular totales (siempre incluir IVA del 21%)
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

    // Guardar referencia al carrito
    const cart = user.cart;
    const cartItems = cart.items as CartItemWithProduct[];

    // Crear pedido y pago en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el pedido como CONFIRMED (no PENDING)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: 'CONFIRMED', // Directamente confirmado
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
          paymentMethod: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
          items: {
            create: cartItems.map((item) => ({
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

      // 2. Crear el pago como COMPLETED
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

      // 3. Descontar stock de productos
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

      // 4. Vaciar el carrito
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
    console.error('Error en checkout:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar el pedido') },
      { status: 500 }
    );
  }
});
