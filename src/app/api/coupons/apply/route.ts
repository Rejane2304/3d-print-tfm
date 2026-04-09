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

const applySchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
});

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

    // Obtener usuario y carrito
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: true,
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

    if (!user.cart || user.cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Buscar cupón (directo o por traducción)
    const searchCode = data.code.toUpperCase();
    let coupon = await prisma.coupon.findUnique({
      where: { code: searchCode },
    });
    
    // Si no se encuentra, buscar en traducciones inversas
    if (!coupon) {
      const { couponTranslations } = await import('@/lib/i18n');
      const reverseTranslations: Record<string, string> = {};
      for (const [eng, esp] of Object.entries(couponTranslations)) {
        reverseTranslations[esp.toUpperCase()] = eng.toUpperCase();
      }
      
      const originalCode = reverseTranslations[searchCode];
      if (originalCode) {
        coupon = await prisma.coupon.findUnique({
          where: { code: originalCode },
        });
      }
    }

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Calcular subtotal del carrito
    const subtotal = user.cart.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

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

    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
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
    let discountType: 'amount' | 'percentage' | 'free_shipping' = 'amount';
    
    if (coupon.type === 'PERCENTAGE') {
      discount = subtotal * (Number(coupon.value) / 100);
      discountType = 'percentage';
    } else if (coupon.type === 'FIXED') {
      discount = Math.min(Number(coupon.value), subtotal);
      discountType = 'amount';
    } else if (coupon.type === 'FREE_SHIPPING') {
      discountType = 'free_shipping';
    }

    // Redondear a 2 decimales
    discount = Math.round(discount * 100) / 100;

    // Actualizar carrito con el cupón aplicado
    // Nota: En una implementación real, podrías querer guardar el couponId en el carrito
    // Aquí devolvemos los datos para que el frontend los maneje

    const tipoTexto = coupon.type === 'PERCENTAGE' 
      ? 'Porcentaje' 
      : coupon.type === 'FIXED' 
        ? 'Fijo' 
        : 'Envío Gratis';

    return NextResponse.json({
      success: true,
      applied: true,
      coupon: {
        id: coupon.id,
        code: translateCouponCode(coupon.code),
        type: tipoTexto,
        typeRaw: coupon.type,
        value: Number(coupon.value),
      },
      cartSummary: {
        subtotal,
        discount,
        discountType,
        freeShipping: coupon.type === 'FREE_SHIPPING',
        totalAfterDiscount: Math.max(0, subtotal - discount),
      },
    });
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
