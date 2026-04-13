/**
 * API de Validación de Cupones
 * Valida un código de cupón sin aplicarlo
 *
 * POST /api/coupons/validate
 * Body: { code: string, orderAmount: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { couponTranslations } from '@/lib/i18n';
import { Decimal } from '@prisma/client/runtime/library';

const validateSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  orderAmount: z
    .number()
    .min(0, 'El monto debe ser mayor o igual a 0')
    .default(0),
});

// Build reverse translation map for Spanish to English coupon codes
function buildReverseTranslations(): Record<string, string> {
  const reverseTranslations: Record<string, string> = {};
  for (const [eng, esp] of Object.entries(couponTranslations)) {
    reverseTranslations[esp.toUpperCase()] = eng.toUpperCase();
  }
  return reverseTranslations;
}

// Find coupon by code or its translation
async function findCouponByCode(searchCode: string) {
  const directCoupon = await prisma.coupon.findUnique({
    where: { code: searchCode },
  });

  if (directCoupon) {
    return directCoupon;
  }

  const reverseTranslations = buildReverseTranslations();
  const originalCode = reverseTranslations[searchCode];

  if (originalCode) {
    return prisma.coupon.findUnique({
      where: { code: originalCode },
    });
  }

  return null;
}

// Validate coupon status and constraints
interface CouponValidationInput {
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number | Decimal | null;
}

function validateCouponConstraints(
  coupon: CouponValidationInput,
  orderAmount: number,
): { valid: false; error: string; status: number } | { valid: true } {
  const now = new Date();

  if (!coupon.isActive) {
    return { valid: false, error: 'Este cupón está inactivo', status: 400 };
  }

  if (coupon.validFrom > now) {
    return { valid: false, error: 'Este cupón aún no está disponible', status: 400 };
  }

  if (coupon.validUntil < now) {
    return { valid: false, error: 'Este cupón ha expirado', status: 400 };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Este cupón ha alcanzado el límite de usos', status: 400 };
  }

  const minAmount = coupon.minOrderAmount !== null ? Number(coupon.minOrderAmount) : null;
  if (minAmount !== null && orderAmount < minAmount) {
    return {
      valid: false,
      error: `El monto mínimo del pedido debe ser de ${minAmount.toFixed(2)}€`,
      status: 400,
    };
  }

  return { valid: true };
}

// Calculate discount based on coupon type
function calculateDiscount(
  couponType: string,
  couponValue: number,
  orderAmount: number,
): number {
  if (couponType === 'PERCENTAGE') {
    return orderAmount * (couponValue / 100);
  }
  if (couponType === 'FIXED') {
    return Math.min(couponValue, orderAmount);
  }
  return 0;
}

// Get display text for coupon type
function getCouponTypeText(couponType: string): string {
  const typeMap: Record<string, string> = {
    PERCENTAGE: 'Porcentaje',
    FIXED: 'Fijo',
    FREE_SHIPPING: 'Envío Gratis',
  };
  return typeMap[couponType] ?? 'Otro';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateSchema.parse(body);

    const searchCode = data.code.toUpperCase();

    const coupon = await findCouponByCode(searchCode);

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 },
      );
    }

    const validation = validateCouponConstraints(coupon, data.orderAmount);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status },
      );
    }

    const discount = calculateDiscount(coupon.type, Number(coupon.value), data.orderAmount);
    const tipoTexto = getCouponTypeText(coupon.type);

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: tipoTexto,
        typeRaw: coupon.type,
        value: Number(coupon.value),
        discount: Math.round(discount * 100) / 100,
        freeShipping: coupon.type === 'FREE_SHIPPING',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('Error validando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}
