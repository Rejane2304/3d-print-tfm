/**
 * API Pública de Zonas de Envío
 * Obtener zonas de envío disponibles
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - Listar Zonas Activas
export async function GET() {
  try {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Formatear para el frontend (español)
    const zonesFormateadas = zones.map(zone => {
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
        diasEstimadosTexto: `${zone.estimatedDaysMin}-${zone.estimatedDaysMax} días hábiles`,
      };
    });

    return NextResponse.json({ success: true, zones: zonesFormateadas });
  } catch (error) {
    console.error('Error listando zonas de envío:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
