/**
 * Admin Site Config API Route
 * GET /api/admin/site-config - Get current config
 * PUT /api/admin/site-config - Update config
 * 
 * Requiere: Rol ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { siteConfigSchema } from '@/lib/validators';
import { z } from 'zod';

const SITE_CONFIG_ID = 'site-config';

// GET - Get current site configuration
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

    // Get or create config
    let config = await prisma.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
    });

    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: SITE_CONFIG_ID,
          companyName: '3D Print',
          companyTaxId: 'B12345678',
          companyAddress: 'Calle Admin 123',
          companyCity: 'Barcelona',
          companyProvince: 'Barcelona',
          companyPostalCode: '08001',
          companyPhone: '+34930000001',
          companyEmail: 'info@3dprint.com',
          defaultVatRate: 21,
          lowStockThreshold: 5,
        },
      });
    }

    // Format for frontend (Spanish)
    const configFormateada = {
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
    };

    return NextResponse.json({ success: true, config: configFormateada });
  } catch (error) {
    console.error('Error getting site config:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// PUT - Update site configuration
export async function PUT(req: NextRequest) {
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

    // Transform Spanish field names to English
    const dataToValidate = {
      companyName: body.nombreEmpresa,
      companyTaxId: body.cifNif,
      companyAddress: body.direccionEmpresa,
      companyCity: body.ciudadEmpresa,
      companyProvince: body.provinciaEmpresa,
      companyPostalCode: body.codigoPostalEmpresa,
      companyPhone: body.telefonoEmpresa,
      companyEmail: body.emailEmpresa,
      defaultVatRate: body.ivaPorDefecto,
      lowStockThreshold: body.umbralStockBajo,
    };

    const validatedData = siteConfigSchema.parse(dataToValidate);

    // Update or create config
    const config = await prisma.siteConfig.upsert({
      where: { id: SITE_CONFIG_ID },
      update: {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      create: {
        id: SITE_CONFIG_ID,
        ...validatedData,
        updatedBy: user.id,
      },
    });

    // Return formatted response
    const configFormateada = {
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
    };

    return NextResponse.json({ success: true, config: configFormateada });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
