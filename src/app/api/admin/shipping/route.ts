/**
 * API de Zonas de Envío Admin
 * CRUD de Zonas de Envío para administradores
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Schema de validación
const shippingZoneSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  country: z.string().min(2, 'El país es obligatorio').max(100, 'Máximo 100 caracteres'),
  regions: z.array(z.string()).min(1, 'Debe incluir al menos una región'),
  postalCodePrefixes: z.array(z.string()).min(1, 'Debe incluir al menos un prefijo de código postal'),
  baseCost: z.number().min(0, 'El costo base debe ser mayor o igual a 0'),
  freeShippingThreshold: z.number().min(0, 'El mínimo para envío gratis debe ser mayor o igual a 0').optional().nullable(),
  estimatedDaysMin: z.number().int().min(1, 'Los días estimados mínimos deben ser al menos 1').default(3),
  estimatedDaysMax: z.number().int().min(1, 'Los días estimados máximos deben ser al menos 1').default(5),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

// GET - Listar Zonas de Envío
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

    const zones = await prisma.shippingZone.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Formatear para el panel admin (español)
    const zonesFormateadas = zones.map((zone) => {
      return {
        id: zone.id,
        nombre: zone.name,
        pais: zone.country,
        regiones: zone.regions,
        regionesTexto: zone.regions.join(', '),
        prefijosCP: zone.postalCodePrefixes,
        prefijosCPTexto: zone.postalCodePrefixes.join(', '),
        costoBase: Number(zone.baseCost),
        costoBaseTexto: `${Number(zone.baseCost).toFixed(2)}€`,
        envioGratisDesde: zone.freeShippingThreshold ? Number(zone.freeShippingThreshold) : null,
        envioGratisDesdeTexto: zone.freeShippingThreshold ? `${Number(zone.freeShippingThreshold).toFixed(2)}€` : null,
        diasEstimadosMin: zone.estimatedDaysMin,
        diasEstimadosMax: zone.estimatedDaysMax,
        diasEstimadosTexto: `${zone.estimatedDaysMin}-${zone.estimatedDaysMax} días`,
        activo: zone.isActive,
        estado: zone.isActive ? 'Activo' : 'Inactivo',
        orden: zone.displayOrder,
        creadoEn: zone.createdAt,
        actualizadoEn: zone.updatedAt,
      };
    });

    return NextResponse.json({ success: true, zones: zonesFormateadas });
  } catch (error) {
    console.error('Error listando zonas de envío:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// POST - Crear Zona de Envío
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
    const data = shippingZoneSchema.parse(body);

    // Validar que los días mínimos no sean mayores que los máximos
    if (data.estimatedDaysMin > data.estimatedDaysMax) {
      return NextResponse.json(
        { success: false, error: 'Los días estimados mínimos no pueden ser mayores que los máximos' },
        { status: 400 }
      );
    }

    // Crear zona de envío
    const zone = await prisma.shippingZone.create({
      data: {
        name: data.name,
        country: data.country,
        regions: data.regions,
        postalCodePrefixes: data.postalCodePrefixes,
        baseCost: data.baseCost,
        freeShippingThreshold: data.freeShippingThreshold,
        estimatedDaysMin: data.estimatedDaysMin,
        estimatedDaysMax: data.estimatedDaysMax,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      },
    });

    return NextResponse.json(
      { success: true, zone },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando zona de envío:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
