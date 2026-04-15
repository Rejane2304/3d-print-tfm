/**
 * API Route - Import Coupons from CSV (Admin)
 * POST /api/admin/coupons/import
 * Imports coupons massively from CSV file
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { CouponType } from '@prisma/client';

// Validation schema for coupon import
const couponImportSchema = z.object({
  code: z.string().min(3, 'Código debe tener al menos 3 caracteres').max(50, 'Máximo 50 caracteres'),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Tipo debe ser PERCENTAGE, FIXED o FREE_SHIPPING' }),
  }),
  value: z
    .string()
    .or(z.number())
    .transform(val => Number(val))
    .refine(val => val >= 0, { message: 'Valor debe ser mayor o igual a 0' }),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }),
  maxUses: z
    .string()
    .or(z.number())
    .optional()
    .transform(val => (val ? Number(val) : null)),
  minOrderAmount: z
    .string()
    .or(z.number())
    .optional()
    .transform(val => (val ? Number(val) : null)),
  isActive: z
    .string()
    .or(z.boolean())
    .optional()
    .transform(val => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes' || val.toLowerCase() === 'si';
      }
      return true;
    }),
});

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { data, options = {} } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
    }

    // Validate required columns
    const requiredColumns = ['code', 'type', 'value', 'validFrom', 'validUntil'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` },
        { status: 400 },
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    // Get existing codes to check for duplicates
    const existingCodes = new Set(
      (
        await prisma.coupon.findMany({
          select: { code: true },
        })
      ).map(c => c.code.toUpperCase()),
    );

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validate row data
        const validatedData = couponImportSchema.parse({
          code: row.code?.trim().toUpperCase(),
          type: row.type?.toUpperCase() as CouponType,
          value: row.value,
          validFrom: row.validFrom?.trim(),
          validUntil: row.validUntil?.trim(),
          maxUses: row.maxUses,
          minOrderAmount: row.minOrderAmount,
          isActive: row.isActive,
        });

        // Check for duplicate code
        if (existingCodes.has(validatedData.code)) {
          if (options.skipDuplicates) {
            result.warnings.push({
              row: rowNumber,
              message: `Código ${validatedData.code} ya existe - omitido`,
            });
            continue;
          } else {
            result.errors.push({
              row: rowNumber,
              message: `Código ${validatedData.code} ya existe`,
            });
            continue;
          }
        }

        // Parse dates
        const validFrom = new Date(validatedData.validFrom);
        const validUntil = new Date(validatedData.validUntil);

        // Validate date range
        if (validUntil <= validFrom) {
          result.errors.push({
            row: rowNumber,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio',
          });
          continue;
        }

        // Validate value based on type
        if (validatedData.type === 'PERCENTAGE' && validatedData.value > 100) {
          result.warnings.push({
            row: rowNumber,
            message: 'Valor de porcentaje mayor a 100% - se importará igual',
          });
        }

        // Create coupon
        await prisma.coupon.create({
          data: {
            id: crypto.randomUUID(),
            code: validatedData.code,
            type: validatedData.type as CouponType,
            value: validatedData.value,
            validFrom,
            validUntil,
            maxUses: validatedData.maxUses,
            minOrderAmount: validatedData.minOrderAmount,
            isActive: validatedData.isActive ?? true,
            usedCount: 0,
            updatedAt: new Date(),
          },
        });

        // Add to existing codes set
        existingCodes.add(validatedData.code);
        result.imported++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push({
            row: rowNumber,
            message: error.errors[0]?.message || 'Error de validación',
          });
        } else {
          result.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }
    }

    return NextResponse.json({
      ...result,
      success: result.errors.length === 0,
      message:
        result.imported > 0 ? `${result.imported} cupones importados exitosamente` : 'No se pudo importar ningún cupón',
    });
  } catch (error) {
    console.error('Error importing coupons:', error);
    return NextResponse.json({ success: false, error: 'Error al importar cupones' }, { status: 500 });
  }
}
