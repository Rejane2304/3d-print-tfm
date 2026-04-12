/**
 * API de Cálculo de Envío
 * Calcula el costo de envío basado en la dirección y el total del carrito
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema de validación
const calculateShippingSchema = z.object({
  country: z.string().min(1, 'El país es obligatorio'),
  region: z.string().min(1, 'La región es obligatoria'),
  postalCode: z.string().min(1, 'El código postal es obligatorio'),
  cartTotal: z
    .number()
    .min(0, 'El total del carrito debe ser mayor o igual a 0'),
});

// POST - Calcular Costo de Envío
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = calculateShippingSchema.parse(body);

    // Buscar zona de envío que corresponda al código postal
    const zones = await prisma.shippingZone.findMany({
      where: {
        isActive: true,
        country: {
          contains: data.country,
          mode: 'insensitive',
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Encontrar la zona que coincide con el prefijo del código postal
    const matchingZone = zones.find((zone) => {
      return zone.postalCodePrefixes.some((prefix) =>
        data.postalCode.startsWith(prefix),
      );
    });

    if (!matchingZone) {
      // Si no hay zona coincidente, buscar zona por defecto (España)
      const defaultZone = zones.find(
        (z) =>
          z.country.toLowerCase().includes('spain') ||
          z.country.toLowerCase().includes('españa'),
      );

      if (!defaultZone) {
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

      // Usar zona por defecto
      const shippingCost = Number(defaultZone.baseCost);
      const freeShippingThreshold = defaultZone.freeShippingThreshold
        ? Number(defaultZone.freeShippingThreshold)
        : null;
      const isFreeShipping = freeShippingThreshold
        ? data.cartTotal >= freeShippingThreshold
        : false;

      return NextResponse.json({
        success: true,
        shippingCost: isFreeShipping ? 0 : shippingCost,
        isFreeShipping,
        freeShippingThreshold,
        amountToFreeShipping: freeShippingThreshold
          ? Math.max(0, freeShippingThreshold - data.cartTotal)
          : null,
        estimatedDaysMin: defaultZone.estimatedDaysMin,
        estimatedDaysMax: defaultZone.estimatedDaysMax,
        estimatedDaysText: `${defaultZone.estimatedDaysMin}-${defaultZone.estimatedDaysMax} días hábiles`,
        zone: {
          id: defaultZone.id,
          name: defaultZone.name,
          country: defaultZone.country,
        },
      });
    }

    // Calcular costo de envío
    const shippingCost = Number(matchingZone.baseCost);
    const freeShippingThreshold = matchingZone.freeShippingThreshold
      ? Number(matchingZone.freeShippingThreshold)
      : null;
    const isFreeShipping = freeShippingThreshold
      ? data.cartTotal >= freeShippingThreshold
      : false;

    return NextResponse.json({
      success: true,
      shippingCost: isFreeShipping ? 0 : shippingCost,
      isFreeShipping,
      freeShippingThreshold,
      amountToFreeShipping: freeShippingThreshold
        ? Math.max(0, freeShippingThreshold - data.cartTotal)
        : null,
      estimatedDaysMin: matchingZone.estimatedDaysMin,
      estimatedDaysMax: matchingZone.estimatedDaysMax,
      estimatedDaysText: `${matchingZone.estimatedDaysMin}-${matchingZone.estimatedDaysMax} días hábiles`,
      zone: {
        id: matchingZone.id,
        name: matchingZone.name,
        country: matchingZone.country,
        regions: matchingZone.regions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('Error calculando envío:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}
