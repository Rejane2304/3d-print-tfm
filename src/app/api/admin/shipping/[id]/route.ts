/**
 * API de Zona de Envío Individual Admin
 * CRUD de una zona de envío específica
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema de validación
const shippingZoneUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres")
    .optional(),
  country: z
    .string()
    .min(2, "El país es obligatorio")
    .max(100, "Máximo 100 caracteres")
    .optional(),
  regions: z
    .array(z.string())
    .min(1, "Debe incluir al menos una región")
    .optional(),
  postalCodePrefixes: z
    .array(z.string())
    .min(1, "Debe incluir al menos un prefijo de código postal")
    .optional(),
  baseCost: z
    .number()
    .min(0, "El costo base debe ser mayor o igual a 0")
    .optional(),
  freeShippingThreshold: z
    .number()
    .min(0, "El mínimo para envío gratis debe ser mayor o igual a 0")
    .optional()
    .nullable(),
  estimatedDaysMin: z
    .number()
    .int()
    .min(1, "Los días estimados mínimos deben ser al menos 1")
    .optional(),
  estimatedDaysMax: z
    .number()
    .int()
    .min(1, "Los días estimados máximos deben ser al menos 1")
    .optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// GET - Obtener Zona de Envío
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Zona de envío no encontrada" },
        { status: 404 },
      );
    }

    // Formatear para el panel admin (español)
    const zoneFormateada = {
      id: zone.id,
      nombre: zone.name,
      pais: zone.country,
      regiones: zone.regions,
      prefijosCP: zone.postalCodePrefixes,
      costoBase: Number(zone.baseCost),
      envioGratisDesde: zone.freeShippingThreshold
        ? Number(zone.freeShippingThreshold)
        : null,
      diasEstimadosMin: zone.estimatedDaysMin,
      diasEstimadosMax: zone.estimatedDaysMax,
      activo: zone.isActive,
      orden: zone.displayOrder,
      creadoEn: zone.createdAt,
      actualizadoEn: zone.updatedAt,
    };

    return NextResponse.json({ success: true, zone: zoneFormateada });
  } catch (error) {
    console.error("Error obteniendo zona de envío:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

// PATCH - Actualizar Zona de Envío
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    // Verificar que la zona existe
    const existing = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Zona de envío no encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = shippingZoneUpdateSchema.parse(body);

    // Validar días estimados
    const minDays = data.estimatedDaysMin ?? existing.estimatedDaysMin;
    const maxDays = data.estimatedDaysMax ?? existing.estimatedDaysMax;

    if (minDays > maxDays) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Los días estimados mínimos no pueden ser mayores que los máximos",
        },
        { status: 400 },
      );
    }

    // Actualizar zona de envío
    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.country && { country: data.country }),
        ...(data.regions && { regions: data.regions }),
        ...(data.postalCodePrefixes && {
          postalCodePrefixes: data.postalCodePrefixes,
        }),
        ...(data.baseCost !== undefined && { baseCost: data.baseCost }),
        ...(data.freeShippingThreshold !== undefined && {
          freeShippingThreshold: data.freeShippingThreshold,
        }),
        ...(data.estimatedDaysMin !== undefined && {
          estimatedDaysMin: data.estimatedDaysMin,
        }),
        ...(data.estimatedDaysMax !== undefined && {
          estimatedDaysMax: data.estimatedDaysMax,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
      },
    });

    return NextResponse.json({ success: true, zone });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error actualizando zona de envío:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar Zona de Envío
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    // Verificar que la zona existe
    const existing = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Zona de envío no encontrada" },
        { status: 404 },
      );
    }

    // Eliminar zona de envío
    await prisma.shippingZone.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Zona de envío eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando zona de envío:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
