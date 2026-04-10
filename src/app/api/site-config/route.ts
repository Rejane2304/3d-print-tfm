/**
 * Public Site Config API Route
 * GET /api/site-config - Get current config (public access)
 * Used by frontend to load configuration on app startup
 */

import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

// GET - Get current site configuration (public)
export async function GET() {
  try {
    const config = await getSiteConfig();

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Configuración no disponible" },
        { status: 500 },
      );
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
    console.error("Error getting site config:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
