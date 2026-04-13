/**
 * API de Cálculo de Envío
 * Calcula el costo de envío basado en la dirección y el total del carrito
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ShippingZone } from '@prisma/client';

// Schema de validación
const calculateShippingSchema = z.object({
  country: z.string().min(1, 'El país es obligatorio'),
  region: z.string().min(1, 'La región es obligatoria'),
  postalCode: z.string().min(1, 'El código postal es obligatorio'),
  cartTotal: z.number().min(0, 'El total del carrito debe ser mayor o igual a 0'),
});

// Tipo para los datos validados
type ShippingRequestData = z.infer<typeof calculateShippingSchema>;

// Tipo para la respuesta de envío
type ShippingResponse = {
  success: boolean;
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number | null;
  amountToFreeShipping: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedDaysText: string;
  zone: {
    id: string;
    name: string;
    country: string;
    regions?: string[];
  };
};

/**
 * Busca zonas de envío activas por país
 */
async function fetchShippingZones(country: string): Promise<ShippingZone[]> {
  return prisma.shippingZone.findMany({
    where: {
      isActive: true,
      country: {
        contains: country,
        mode: 'insensitive',
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });
}

/**
 * Encuentra la zona que coincide con el prefijo del código postal
 */
function findZoneByPostalCode(zones: ShippingZone[], postalCode: string): ShippingZone | undefined {
  return zones.find(zone => zone.postalCodePrefixes.some(prefix => postalCode.startsWith(prefix)));
}

/**
 * Busca la zona por defecto (España)
 */
function findDefaultZone(zones: ShippingZone[]): ShippingZone | undefined {
  return zones.find(z => z.country.toLowerCase().includes('spain') || z.country.toLowerCase().includes('españa'));
}

/**
 * Calcula si aplica envío gratis y el costo final
 */
function calculateShippingCost(
  zone: ShippingZone,
  cartTotal: number,
): {
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number | null;
  amountToFreeShipping: number | null;
} {
  const baseCost = Number(zone.baseCost);
  const freeThreshold = zone.freeShippingThreshold ? Number(zone.freeShippingThreshold) : null;
  const isFree = freeThreshold ? cartTotal >= freeThreshold : false;

  return {
    shippingCost: isFree ? 0 : baseCost,
    isFreeShipping: isFree,
    freeShippingThreshold: freeThreshold,
    amountToFreeShipping: freeThreshold ? Math.max(0, freeThreshold - cartTotal) : null,
  };
}

/**
 * Construye la respuesta de envío
 */
function buildShippingResponse(
  zone: ShippingZone,
  data: ShippingRequestData,
  includeRegions = false,
): ShippingResponse {
  const costDetails = calculateShippingCost(zone, data.cartTotal);

  return {
    success: true,
    ...costDetails,
    estimatedDaysMin: zone.estimatedDaysMin,
    estimatedDaysMax: zone.estimatedDaysMax,
    estimatedDaysText: `${zone.estimatedDaysMin}-${zone.estimatedDaysMax} días hábiles`,
    zone: {
      id: zone.id,
      name: zone.name,
      country: zone.country,
      ...(includeRegions && { regions: zone.regions }),
    },
  };
}

/**
 * Maneja el caso cuando no se encuentra zona de envío
 */
function handleNoZoneFound(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'No se encontró una zona de envío para esta dirección',
      shippingCost: 0,
      isFreeShipping: false,
      estimatedDays: null,
    },
    { status: 400 },
  );
}

// POST - Calcular Costo de Envío
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = calculateShippingSchema.parse(body);

    const zones = await fetchShippingZones(data.country);
    const matchingZone = findZoneByPostalCode(zones, data.postalCode);

    if (matchingZone) {
      return NextResponse.json(buildShippingResponse(matchingZone, data, true));
    }

    const defaultZone = findDefaultZone(zones);

    if (!defaultZone) {
      return handleNoZoneFound();
    }

    return NextResponse.json(buildShippingResponse(defaultZone, data, false));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error calculando envío:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
