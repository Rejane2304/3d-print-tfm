/**
 * Public Site Config API Route
 * GET /api/site-config - Get current config (public access)
 * Used by frontend to load configuration on app startup
 */

import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/site-config';

// Default config for production fallback
const DEFAULT_CONFIG = {
  _ref: 'SITE-CONFIG',
  nombreEmpresa: '3D Print',
  cifNif: 'B12345678',
  direccionEmpresa: 'Calle Admin 123',
  ciudadEmpresa: 'Barcelona',
  provinciaEmpresa: 'Barcelona',
  codigoPostalEmpresa: '08001',
  telefonoEmpresa: '+34 930 000 001',
  emailEmpresa: 'info@3dprint.com',
  ivaPorDefecto: 21,
  umbralStockBajo: 5,
  actualizadoEn: new Date().toISOString(),
};

// GET - Get current site configuration (public)
export async function GET() {
  try {
    const config = await getSiteConfig();

    // Si no hay config en BD, usar valores por defecto
    if (!config) {
      console.warn('[SiteConfig] Using default config - database record not found');
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
      });
    }

    // Return formatted response for frontend
    return NextResponse.json({
      success: true,
      config: {
        _ref: config.id.toUpperCase(),
        nombreEmpresa: config.companyName,
        cifNif: config.companyTaxId,
        direccionEmpresa: config.companyAddress,
        ciudadEmpresa: config.companyCity,
        provinciaEmpresa: config.companyProvince,
        codigoPostalEmpresa: config.companyPostalCode,
        telefonoEmpresa: config.companyPhone,
        emailEmpresa: config.companyEmail,
        ivaPorDefecto: config.defaultVatRate,
        umbralStockBajo: config.lowStockThreshold,
        actualizadoEn: config.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting site config:', error);
    // Incluso en error, retornar config por defecto para no romper la app
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
    });
  }
}
