/**
 * API de Cupones Públicos
 * GET /api/coupons - Lista cupones activos disponibles para el usuario
 *
 * Devuelve solo cupones válidos y activos
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { translateCouponCode } from '@/lib/i18n';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const now = new Date();

    // Obtener cupones activos y válidos
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [{ maxUses: null }, { usedCount: { lt: prisma.coupon.fields.maxUses } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear respuesta
    const formattedCoupons = coupons.map(coupon => {
      let description = '';
      if (coupon.type === 'PERCENTAGE') {
        description = `${coupon.value}% de descuento`;
      } else if (coupon.type === 'FIXED') {
        description = `${coupon.value}€ de descuento`;
      } else if (coupon.type === 'FREE_SHIPPING') {
        description = 'Envío gratis';
      }

      if (coupon.minOrderAmount) {
        description += ` (mínimo ${coupon.minOrderAmount}€)`;
      }

      return {
        id: coupon.id,
        code: translateCouponCode(coupon.code),
        codeRaw: coupon.code,
        description,
        type: coupon.type,
        value: Number(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      };
    });

    return NextResponse.json({ success: true, data: { coupons: formattedCoupons } });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
