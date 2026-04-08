/**
 * API de Cupones Admin
 * CRUD de Cupones para administradores
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { CouponType } from '@prisma/client';
import { translateCouponCode } from '@/lib/i18n';

// Schema de validación
const couponSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').max(50, 'Máximo 50 caracteres'),
  type: z.enum(['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Tipo inválido. Debe ser FIXED, PERCENTAGE o FREE_SHIPPING' }),
  }),
  value: z.number().min(0, 'El valor debe ser mayor o igual a 0').default(0),
  minOrderAmount: z.number().min(0, 'El mínimo debe ser mayor o igual a 0').optional(),
  maxUses: z.number().int().min(1, 'El máximo de usos debe ser al menos 1').optional(),
  validFrom: z.string().datetime('Fecha de inicio inválida'),
  validUntil: z.string().datetime('Fecha de fin inválida'),
  isActive: z.boolean().default(true),
});

// GET - Listar Cupones
export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    // Formatear para el panel admin (español)
    const couponsFormateados = coupons.map((coupon) => {
      const now = new Date();
      const isExpired = coupon.validUntil < now;
      const isNotStarted = coupon.validFrom > now;
      const isMaxedOut = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
      
      let estado = 'Activo';
      if (!coupon.isActive) estado = 'Inactivo';
      else if (isExpired) estado = 'Expirado';
      else if (isNotStarted) estado = 'Pendiente';
      else if (isMaxedOut) estado = 'Agotado';

      const tipoTexto = coupon.type === 'PERCENTAGE' 
        ? 'Porcentaje' 
        : coupon.type === 'FIXED' 
          ? 'Fijo' 
          : 'Envío Gratis';

      const valorTexto = coupon.type === 'PERCENTAGE' 
        ? `${coupon.value}%` 
        : coupon.type === 'FIXED' 
          ? `${coupon.value}€` 
          : 'Gratis';

      return {
        id: coupon.id,
        _ref: coupon.id.slice(0, 8).toUpperCase(),
        codigo: translateCouponCode(coupon.code),
        tipo: tipoTexto,
        tipoRaw: coupon.type,
        valor: valorTexto,
        valorRaw: Number(coupon.value),
        minimoCompra: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
        usosMaximos: coupon.maxUses,
        usosActuales: coupon.usedCount,
        usosRestantes: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
        validoDesde: coupon.validFrom,
        validoHasta: coupon.validUntil,
        activo: coupon.isActive,
        estado,
        creadoEn: coupon.createdAt,
        actualizadoEn: coupon.updatedAt,
      };
    });

    return NextResponse.json({ success: true, coupons: couponsFormateados });
  } catch (error) {
    console.error('Error listando cupones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// POST - Crear Cupón
export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = couponSchema.parse(body);

    // Verificar que el código no exista
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un cupón con ese código' },
        { status: 400 }
      );
    }

    // Validar fechas
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);
    
    if (validUntil <= validFrom) {
      return NextResponse.json(
        { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }

    // Crear cupón
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type as CouponType,
        value: data.value,
        minOrderAmount: data.minOrderAmount || null,
        maxUses: data.maxUses || null,
        validFrom,
        validUntil,
        isActive: data.isActive,
        usedCount: 0,
      },
    });

    return NextResponse.json(
      { success: true, coupon },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
