/**
 * API Route for Checkout with Coupon Support
 *
 * POST /api/checkout - Create order with optional coupon discount
 *
 * Now supports: couponCode in request body
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
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

interface ValidationResult {
  shippingAddressId: string;
  paymentMethod: string;
  couponCode?: string;
}

interface CouponValidationResult {
  couponId: string | null;
  couponDiscount: number;
  hasFreeShipping: boolean;
}

interface TotalsResult {
  subtotal: number;
  couponDiscount: number;
  shippingCost: number;
  total: number;
  discountedSubtotal: number;
}

interface OrderTransactionParams {
  userId: string;
  items: CartItemWithProduct[];
  totals: TotalsResult;
  addressId: string;
  paymentMethod: string;
  couponId: string | null;
  orderNumber: string;
  userName: string;
  userEmail: string;
}

// Validate request body
function validateRequest(body: unknown): ValidationResult | null {
  const { shippingAddressId, paymentMethod = 'CARD', couponCode } = body as Record<string, unknown>;

  if (!shippingAddressId || typeof shippingAddressId !== 'string') {
    return null;
  }

  const validPaymentMethods = ['CARD', 'PAYPAL', 'BIZUM', 'TRANSFER'];
  if (!validPaymentMethods.includes(paymentMethod as string)) {
    return null;
  }

  return {
    shippingAddressId,
    paymentMethod: paymentMethod as string,
    couponCode: couponCode as string | undefined,
  };
}

// Get user with cart
async function getUserWithCart(email: string) {
  return prisma.user.findUnique({
    where: { email },
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
}

// Validate stock availability
function validateStock(items: CartItemWithProduct[]): string | null {
  for (const item of items) {
    if (item.product.stock < item.quantity) {
      return `Stock insuficiente para ${item.product.name}`;
    }
  }
  return null;
}

// Validate and calculate coupon discount
async function validateCoupon(couponCode: string | undefined, subtotal: number): Promise<CouponValidationResult> {
  const result: CouponValidationResult = {
    couponId: null,
    couponDiscount: 0,
    hasFreeShipping: false,
  };

  if (!couponCode) {
    return result;
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  });

  if (!coupon) {
    return result;
  }

  const now = new Date();
  const isValid =
    coupon.isActive &&
    coupon.validFrom <= now &&
    coupon.validUntil >= now &&
    (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
    (coupon.minOrderAmount === null || subtotal >= Number(coupon.minOrderAmount));

  if (!isValid) {
    return result;
  }

  result.couponId = coupon.id;

  if (coupon.type === 'PERCENTAGE') {
    result.couponDiscount = subtotal * (Number(coupon.value) / 100);
  } else if (coupon.type === 'FIXED') {
    result.couponDiscount = Math.min(Number(coupon.value), subtotal);
  } else if (coupon.type === 'FREE_SHIPPING') {
    result.hasFreeShipping = true;
  }

  result.couponDiscount = Math.round(result.couponDiscount * 100) / 100;

  return result;
}

// Calculate order totals
function calculateTotals(subtotal: number, couponDiscount: number, hasFreeShipping: boolean): TotalsResult {
  const taxRate = DEFAULT_VAT_RATE;
  const shippingCost = subtotal >= 50 || hasFreeShipping ? 0 : 5.99;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const total = roundToCents(discountedSubtotal * (1 + taxRate) + shippingCost);

  return {
    subtotal,
    couponDiscount,
    shippingCost,
    total,
    discountedSubtotal,
  };
}

// Get shipping address
async function getShippingAddress(addressId: string) {
  return prisma.address.findUnique({
    where: { id: addressId },
  });
}

// Generate order number
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `P-${year}${String(count + 1).padStart(6, '0')}`;
}

// Create order transaction
async function createOrderTransaction(params: OrderTransactionParams) {
  const {
    userId,
    items,
    totals,
    addressId,
    paymentMethod,
    couponId,
    orderNumber,
    // userName and userEmail available in params but not needed here
  } = params;

  const address = await getShippingAddress(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  return prisma.$transaction(async tx => {
    // 1. Create the order
    const order = await tx.order.create({
      data: {
        id: crypto.randomUUID(),
        user: { connect: { id: userId } },
        status: 'PENDING',
        orderNumber,
        subtotal: totals.subtotal,
        shipping: totals.shippingCost,
        discount: totals.couponDiscount > 0 ? totals.couponDiscount : undefined,
        total: totals.total,
        shippingAddressData: { connect: { id: addressId } },
        shippingName: address.recipient,
        shippingPhone: address.phone,
        shippingAddress: address.address,
        shippingComplement: address.complement,
        shippingPostalCode: address.postalCode,
        shippingCity: address.city,
        shippingProvince: address.province,
        shippingCountry: address.country,
        paymentMethod: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
        updatedAt: new Date(),
        items: {
          create: items.map((item: CartItemWithProduct) => ({
            id: crypto.randomUUID(),
            product: { connect: { id: item.product.id } },
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

    // 2. Create the payment
    const payment = await createPaymentRecord(tx, order.id, totals.total, paymentMethod);

    // 3. Increment coupon usage if applicable
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 4. Deduct stock and create inventory movements
    for (const item of items) {
      const product = await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          id: crypto.randomUUID(),
          productId: item.productId,
          orderId: order.id,
          createdBy: userId,
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
    const cart = await tx.cart.findFirst({
      where: { userId },
    });
    if (cart) {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { order, payment };
  });
}

// Create payment record
async function createPaymentRecord(
  tx: Prisma.TransactionClient,
  orderId: string,
  total: number,
  paymentMethod: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return tx.payment.create({
    data: {
      id: crypto.randomUUID(),
      order: { connect: { id: orderId } },
      user: { connect: { id: order.userId } },
      amount: total,
      method: paymentMethod as 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
      status: 'PENDING',
      updatedAt: new Date(),
    },
  });
}

// POST /api/checkout - Create order and process payment
export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // 2. Parse and validate request body
  const body = await req.json();

  // Debug log
  // eslint-disable-next-line no-console
  console.log('[Checkout API] Request body:', JSON.stringify(body, null, 2));

  const validation = validateRequest(body);
  if (!validation) {
    return NextResponse.json({ success: false, error: 'Datos de solicitud inválidos' }, { status: 400 });
  }

  const { shippingAddressId, paymentMethod, couponCode } = validation;

  // 3. Get user with cart
  const user = await getUserWithCart(session.user.email);
  if (!user) {
    return NextResponse.json({ success: false, error: translateErrorMessage('Usuario not found') }, { status: 404 });
  }

  // Debug log
  // eslint-disable-next-line no-console
  console.log('[Checkout API] User cart:', {
    hasCart: !!user.cart,
    cartId: user.cart?.id,
    itemCount: user.cart?.items?.length ?? 0,
    items: user.cart?.items?.map(i => ({ id: i.id, productId: i.productId, quantity: i.quantity })),
  });

  // 4. Verify cart has items
  if (!user.cart || user.cart.items.length === 0) {
    return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
  }

  const cartItems = user.cart.items as CartItemWithProduct[];

  // 5. Validate stock
  const stockError = validateStock(cartItems);
  if (stockError) {
    return NextResponse.json({ success: false, error: stockError }, { status: 400 });
  }

  // 6. Calculate subtotal
  const subtotal = Number(user.cart.subtotal);

  // 7. Validate coupon
  const { couponId, couponDiscount, hasFreeShipping } = await validateCoupon(couponCode, subtotal);

  // 8. Calculate totals
  const totals = calculateTotals(subtotal, couponDiscount, hasFreeShipping);

  // 9. Generate order number
  const orderNumber = await generateOrderNumber();

  // 10. Create order transaction
  const result = await createOrderTransaction({
    userId: user.id,
    items: cartItems,
    totals,
    addressId: shippingAddressId,
    paymentMethod,
    couponId,
    orderNumber,
    userName: user.name || '',
    userEmail: user.email,
  });

  // 11. Emit real-time event
  await emitNewOrder({
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    total: Number(result.order.total),
    userName: user.name || user.email,
    timestamp: new Date().toISOString(),
  });

  // 12. Create alert
  try {
    await createNewOrderAlert(result.order.id, result.order.orderNumber, Number(result.order.total));
  } catch (alertError) {
    console.error('Error creating new order alert:', alertError);
  }

  // 13. Return response
  return NextResponse.json({
    success: true,
    orderId: result.order.id,
    paymentId: result.payment.id,
    orderNumber: result.order.orderNumber,
    status: 'PENDING',
    paymentMethod: translatePaymentMethod(paymentMethod),
    discount: totals.couponDiscount > 0 ? totals.couponDiscount : undefined,
    message: 'Pedido creado. Proceda al pago.',
  });
});
