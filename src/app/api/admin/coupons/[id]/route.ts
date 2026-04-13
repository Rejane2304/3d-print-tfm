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
import { Coupon, CouponType } from '@prisma/client';
import { translateCouponCode } from '@/lib/i18n';

// Schema de validación
const couponUpdateSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .optional(),
  type: z
    .enum(['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'], {
      errorMap: () => ({ message: 'Tipo inválido' }),
    })
    .optional(),
  value: z.number().min(0, 'El valor debe ser mayor o igual a 0').optional(),
  minOrderAmount: z
    .number()
    .min(0, 'El mínimo debe ser mayor o igual a 0')
    .optional()
    .nullable(),
  maxUses: z
    .number()
    .int()
    .min(1, 'El máximo de usos debe ser al menos 1')
    .optional()
    .nullable(),
  validFrom: z.string().datetime('Fecha de inicio inválida').optional(),
  validUntil: z.string().datetime('Fecha de fin inválida').optional(),
  isActive: z.boolean().optional(),
});

// Helpers para autenticación
async function authenticateAdmin() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user?.role !== 'ADMIN') {
    return { error: 'No autorizado', status: 401 };
  }

  return { user };
}

// Helper para calcular el estado del cupón
function calcularEstadoCupón(coupon: Coupon, now: Date): string {
  const isExpired = coupon.validUntil < now;
  const isNotStarted = coupon.validFrom > now;
  const isMaxedOut = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

  if (!coupon.isActive) {
    return 'Inactivo';
  }
  if (isExpired) {
    return 'Expirado';
  }
  if (isNotStarted) {
    return 'Pendiente';
  }
  if (isMaxedOut) {
    return 'Agotado';
  }
  return 'Activo';
}

// Helper para obtener el texto del tipo de cupón
function obtenerTipoTexto(type: CouponType): string {
  const tipos: Record<CouponType, string> = {
    PERCENTAGE: 'Porcentaje',
    FIXED: 'Fijo',
    FREE_SHIPPING: 'Envío Gratis',
  };
  return tipos[type];
}

// Helper para formatear el valor del cupón
function formatearValor(coupon: Coupon): string {
  if (coupon.type === 'PERCENTAGE') {
    return `${coupon.value}%`;
  }
  if (coupon.type === 'FIXED') {
    return `${coupon.value}€`;
  }
  return 'Gratis';
}

// Helper para formatear cupón completo
function formatearCupón(coupon: Coupon) {
  const now = new Date();
  const estado = calcularEstadoCupón(coupon, now);

  return {
    id: coupon.id,
    _ref: coupon.id.slice(0, 8).toUpperCase(),
    codigo: translateCouponCode(coupon.code),
    codigoRaw: coupon.code,
    tipo: obtenerTipoTexto(coupon.type),
    tipoRaw: coupon.type,
    valor: formatearValor(coupon),
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
}

// Helper para construir datos de actualización
function construirDatosActualizacion(data: z.infer<typeof couponUpdateSchema>) {
  const updateData: Record<string, unknown> = {};

  if (data.type) {
    updateData.type = data.type;
  }
  if (data.value !== undefined) {
    updateData.value = data.value;
  }
  if (data.minOrderAmount !== undefined) {
    updateData.minOrderAmount = data.minOrderAmount;
  }
  if (data.maxUses !== undefined) {
    updateData.maxUses = data.maxUses;
  }
  if (data.validFrom) {
    updateData.validFrom = new Date(data.validFrom);
  }
  if (data.validUntil) {
    updateData.validUntil = new Date(data.validUntil);
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  return updateData;
}

// GET - Obtener Cupón
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const auth = await authenticateAdmin();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const coupon = await prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 },
      );
    }

    const couponFormateado = formatearCupón(coupon);

    return NextResponse.json({ success: true, coupon: couponFormateado });
  } catch (error) {
    console.error('Error obteniendo cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// Helper para verificar si el código ya existe
async function checkDuplicateCode(
  code: string,
  existingCode: string,
): Promise<string | null> {
  if (code === existingCode) {
    return null;
  }

  const codeExists = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (codeExists) {
    return 'Ya existe un cupón con ese código';
  }

  return null;
}

// Helper para validar fechas
function validateDates(
  newValidFrom: string | undefined,
  newValidUntil: string | undefined,
  existingValidFrom: Date,
  existingValidUntil: Date,
): { error: string | null; validFrom: Date; validUntil: Date } {
  const validFrom = newValidFrom
    ? new Date(newValidFrom)
    : existingValidFrom;
  const validUntil = newValidUntil
    ? new Date(newValidUntil)
    : existingValidUntil;

  if (validUntil <= validFrom) {
    return {
      error: 'La fecha de fin debe ser posterior a la fecha de inicio',
      validFrom,
      validUntil,
    };
  }

  return { error: null, validFrom, validUntil };
}

// PATCH - Actualizar Cupón
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const auth = await authenticateAdmin();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = couponUpdateSchema.parse(body);

    // Verificar código duplicado
    if (data.code) {
      const duplicateError = await checkDuplicateCode(data.code, existing.code);
      if (duplicateError) {
        return NextResponse.json(
          { success: false, error: duplicateError },
          { status: 400 },
        );
      }
    }

    // Validar fechas
    if (data.validFrom || data.validUntil) {
      const { error: dateError } = validateDates(
        data.validFrom,
        data.validUntil,
        existing.validFrom,
        existing.validUntil,
      );

      if (dateError) {
        return NextResponse.json(
          { success: false, error: dateError },
          { status: 400 },
        );
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: construirDatosActualizacion(data),
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('Error actualizando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar Cupón
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const auth = await authenticateAdmin();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cupón no encontrado' },
        { status: 404 },
      );
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Cupón eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando cupón:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}
