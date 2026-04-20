/**
 * API de Zona de Envío Individual Admin
 * CRUD de una zona de envío específica
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import type { ShippingZone } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Schema de validación
const shippingZoneUpdateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  country: z.string().min(2, 'El país es obligatorio').max(100, 'Máximo 100 caracteres').optional(),
  regions: z.array(z.string()).min(1, 'Debe incluir al menos una región').optional(),
  postalCodePrefixes: z.array(z.string()).min(1, 'Debe incluir al menos un prefijo de código postal').optional(),
  baseCost: z.number().min(0, 'El costo base debe ser mayor o igual a 0').optional(),
  freeShippingThreshold: z
    .number()
    .min(0, 'El mínimo para envío gratis debe ser mayor o igual a 0')
    .optional()
    .nullable(),
  estimatedDaysMin: z.number().int().min(1, 'Los días estimados mínimos deben ser al menos 1').optional(),
  estimatedDaysMax: z.number().int().min(1, 'Los días estimados máximos deben ser al menos 1').optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * Verifica autenticación de administrador
 * Retorna null si OK, o NextResponse con error si falla
 */
async function verifyAdminAuth(): Promise<null | NextResponse> {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  return null;
}

/**
 * Formatea la zona de envío para el panel admin (español)
 */
function formatShippingZone(zone: ShippingZone) {
  return {
    id: zone.id,
    nombre: zone.name,
    pais: zone.country,
    regiones: zone.regions,
    prefijosCP: zone.postalCodePrefixes,
    costoBase: Number(zone.baseCost),
    envioGratisDesde: zone.freeShippingThreshold ? Number(zone.freeShippingThreshold) : null,
    diasEstimadosMin: zone.estimatedDaysMin,
    diasEstimadosMax: zone.estimatedDaysMax,
    activo: zone.isActive,
    orden: zone.displayOrder,
    creadoEn: zone.createdAt,
    actualizadoEn: zone.updatedAt,
  };
}

// GET - Obtener Zona de Envío
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return NextResponse.json({ success: false, error: 'Zona de envío no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      zone: formatShippingZone(zone),
    });
  } catch (error) {
    console.error('Error obteniendo zona de envío:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// PATCH - Actualizar Zona de Envío
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return NextResponse.json({ success: false, error: 'Zona de envío no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const data = shippingZoneUpdateSchema.parse(body);

    const validationError = validateShippingDays(data, zone);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const updateData = buildUpdateData(data);

    const updatedZone = await prisma.shippingZone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error actualizando zona de envío:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

/**
 * Valida que los días estimados sean coherentes
 */
function validateShippingDays(
  data: Partial<z.infer<typeof shippingZoneUpdateSchema>>,
  existing: ShippingZone,
): string | null {
  const minDays = data.estimatedDaysMin ?? existing.estimatedDaysMin;
  const maxDays = data.estimatedDaysMax ?? existing.estimatedDaysMax;

  if (minDays > maxDays) {
    return 'Los días estimados mínimos no pueden ser mayores que los máximos';
  }

  return null;
}

/**
 * Construye el objeto de actualización
 */
function buildUpdateData(data: Partial<z.infer<typeof shippingZoneUpdateSchema>>): Partial<ShippingZone> {
  const updateData: Partial<ShippingZone> = {};

  if (data.name) updateData.name = data.name;
  if (data.country) updateData.country = data.country;
  if (data.regions) updateData.regions = data.regions;
  if (data.postalCodePrefixes) {
    updateData.postalCodePrefixes = data.postalCodePrefixes;
  }
  if (data.baseCost !== undefined) {
    updateData.baseCost = new Decimal(data.baseCost);
  }
  if (data.freeShippingThreshold !== undefined) {
    updateData.freeShippingThreshold =
      data.freeShippingThreshold === null ? null : new Decimal(data.freeShippingThreshold);
  }
  if (data.estimatedDaysMin !== undefined) {
    updateData.estimatedDaysMin = data.estimatedDaysMin;
  }
  if (data.estimatedDaysMax !== undefined) {
    updateData.estimatedDaysMax = data.estimatedDaysMax;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

  return updateData;
}

// DELETE - Eliminar Zona de Envío
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const _zone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!_zone) {
      return NextResponse.json({ success: false, error: 'Zona de envío no encontrada' }, { status: 404 });
    }

    await prisma.shippingZone.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Zona de envío eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando zona de envío:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
