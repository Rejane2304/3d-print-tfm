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

const validateSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  orderAmount: z.number().min(0, 'El monto debe ser mayor o igual a 0').default(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateSchema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    const now = new Date();
    
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Este cupón está inactivo' },
        { status: 400 }
      );
    }

    if (coupon.validFrom > now) {
      return NextResponse.json(
        { success: false, error: 'Este cupón aún no está disponible' },
        { status: 400 }
      );
    }

    if (coupon.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'Este cupón ha expirado' },
        { status: 400 }
      );
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Este cupón ha alcanzado el límite de usos' },
        { status: 400 }
      );
    }

    if (coupon.minOrderAmount !== null && data.orderAmount < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `El monto mínimo del pedido debe ser de ${Number(coupon.minOrderAmount).toFixed(2)}€` 
        },
        { status: 400 }
      );
    }

    // Calcular descuento
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = data.orderAmount * (Number(coupon.value) / 100);
    } else if (coupon.type === 'FIXED') {
      discount = Math.min(Number(coupon.value), data.orderAmount);
    } else if (coupon.type === 'FREE_SHIPPING') {
      // El descuento de envío gratis se maneja separadamente
      discount = 0;
    }

    // Formatear respuesta
    const tipoTexto = coupon.type === 'PERCENTAGE' 
      ? 'Porcentaje' 
      : coupon.type === 'FIXED' 
        ? 'Fijo' 
        : 'Envío Gratis';

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
        { status: 400 }
      );
    }
    console.error('Error validando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
