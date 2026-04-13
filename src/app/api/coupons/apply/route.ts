/**
 * API de Aplicación de Cupones
 * Valida y aplica un cupón al carrito del usuario
 *
 * POST /api/coupons/apply
 * Body: { code: string }
 * Requiere autenticación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { translateCouponCode } from '@/lib/i18n';
import { Coupon } from '@prisma/client';

const applySchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
});

interface ValidationError {
  valid: false;
  error: string;
}

interface ValidationSuccess {
  valid: true;
}

type ValidationResult = ValidationError | ValidationSuccess;

interface DiscountResult {
  amount: number;
  type: 'amount' | 'percentage' | 'free_shipping';
}

/**
 * Busca un cupón por código, incluyendo búsqueda por traducciones
 */
async function findCoupon(code: string): Promise<Coupon | null> {
  const searchCode = code.toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: searchCode },
  });

  if (coupon) {
    return coupon;
  }

  const { couponTranslations } = await import('@/lib/i18n');
  const reverseTranslations: Record<string, string> = {};
  for (const [eng, esp] of Object.entries(couponTranslations)) {
    reverseTranslations[esp.toUpperCase()] = eng.toUpperCase();
  }

  const originalCode = reverseTranslations[searchCode];
  if (!originalCode) {
    return null;
  }

  return prisma.coupon.findUnique({
    where: { code: originalCode },
  });
}

/**
 * Valida que el cupón esté activo y disponible
 */
function validateCouponStatus(coupon: Coupon, now: Date): ValidationResult {
  if (!coupon.isActive) {
    return { valid: false, error: 'Este cupón está inactivo' };
  }

  if (coupon.validFrom > now) {
    return { valid: false, error: 'Este cupón aún no está disponible' };
  }

  if (coupon.validUntil < now) {
    return { valid: false, error: 'Este cupón ha expirado' };
  }

  return { valid: true };
}

/**
 * Valida los límites de uso del cupón
 */
function validateCouponLimits(coupon: Coupon): ValidationResult {
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Este cupón ha alcanzado el límite de usos' };
  }

  return { valid: true };
}

/**
 * Valida el monto mínimo del pedido
 */
function validateMinOrderAmount(coupon: Coupon, subtotal: number): ValidationResult {
  if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
    const minAmount = Number(coupon.minOrderAmount).toFixed(2);
    return {
      valid: false,
      error: `El monto mínimo del pedido debe ser de ${minAmount}€`,
    };
  }

  return { valid: true };
}

/**
 * Valida un cupón contra todas las reglas de negocio
 */
function validateCoupon(
  coupon: Coupon,
  subtotal: number,
  now: Date
): ValidationResult {
  const statusValidation = validateCouponStatus(coupon, now);
  if (!statusValidation.valid) {
    return statusValidation;
  }

  const limitsValidation = validateCouponLimits(coupon);
  if (!limitsValidation.valid) {
    return limitsValidation;
  }

  const amountValidation = validateMinOrderAmount(coupon, subtotal);
  if (!amountValidation.valid) {
    return amountValidation;
  }

  return { valid: true };
}

/**
 * Calcula el descuento según el tipo de cupón
 */
function calculateDiscount(coupon: Coupon, subtotal: number): DiscountResult {
  if (coupon.type === 'PERCENTAGE') {
    return {
      amount: Math.round(subtotal * (Number(coupon.value) / 100) * 100) / 100,
      type: 'percentage',
    };
  }

  if (coupon.type === 'FREE_SHIPPING') {
    return { amount: 0, type: 'free_shipping' };
  }

  return {
    amount: Math.min(Number(coupon.value), subtotal),
    type: 'amount',
  };
}

/**
 * Obtiene el texto del tipo de cupón en español
 */
function getCouponTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    PERCENTAGE: 'Porcentaje',
    FIXED: 'Fijo',
    FREE_SHIPPING: 'Envío Gratis',
  };

  return typeMap[type] ?? 'Desconocido';
}

/**
 * Calcula el subtotal del carrito
 */
function calculateCartSubtotal(
  items: Array<{ unitPrice: { toNumber: () => number } | number | string; quantity: number }>
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
}

/**
 * Crea la respuesta exitosa con el cupón aplicado
 */
function createSuccessResponse(coupon: Coupon, subtotal: number, discount: DiscountResult) {
  return NextResponse.json({
    success: true,
    applied: true,
    coupon: {
      id: coupon.id,
      code: translateCouponCode(coupon.code),
      type: getCouponTypeText(coupon.type),
      typeRaw: coupon.type,
      value: Number(coupon.value),
    },
    cartSummary: {
      subtotal,
      discount: discount.amount,
      discountType: discount.type,
      freeShipping: coupon.type === 'FREE_SHIPPING',
      totalAfterDiscount: Math.max(0, subtotal - discount.amount),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = applySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cart: {
          include: {
            items: true,
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

    if (!user.cart || user.cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    const coupon = await findCoupon(data.code);

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    const subtotal = calculateCartSubtotal(user.cart.items);
    const validation = validateCoupon(coupon, subtotal, new Date());

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const discount = calculateDiscount(coupon, subtotal);
    return createSuccessResponse(coupon, subtotal, discount);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error aplicando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
