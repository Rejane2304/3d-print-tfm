/**
 * API de Cupón Individual Admin
 * CRUD de un cupón específico
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { CouponType } from '@prisma/client';

// Schema de validación
const couponUpdateSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').max(50, 'Máximo 50 caracteres').optional(),
  type: z.enum(['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Tipo inválido' }),
  }).optional(),
  value: z.number().min(0, 'El valor debe ser mayor o igual a 0').optional(),
  minOrderAmount: z.number().min(0, 'El mínimo debe ser mayor o igual a 0').optional().nullable(),
  maxUses: z.number().int().min(1, 'El máximo de usos debe ser al menos 1').optional().nullable(),
  validFrom: z.string().datetime('Fecha de inicio inválida').optional(),
  validUntil: z.string().datetime('Fecha de fin inválida').optional(),
  isActive: z.boolean().optional(),
});

// GET - Obtener Cupón
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Formatear para el panel admin (español)
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

    const couponFormateado = {
      id: coupon.id,
      _ref: coupon.id.slice(0, 8).toUpperCase(),
      codigo: coupon.code,
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

    return NextResponse.json({ success: true, coupon: couponFormateado });
  } catch (error) {
    console.error('Error obteniendo cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar Cupón
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Verificar que el cupón existe
    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = couponUpdateSchema.parse(body);

    // Si se está actualizando el código, verificar que no exista otro con ese código
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cupón con ese código' },
          { status: 400 }
        );
      }
    }

    // Validar fechas si se proporcionan
    if (data.validFrom || data.validUntil) {
      const validFrom = data.validFrom ? new Date(data.validFrom) : existing.validFrom;
      const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil;
      
      if (validUntil <= validFrom) {
        return NextResponse.json(
          { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        );
      }
    }

    // Actualizar cupón
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.type && { type: data.type as CouponType }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
        ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
        ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar Cupón
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Verificar que el cupón existe
    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar cupón
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cupón eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error eliminando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
