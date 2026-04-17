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
    .transform(Number)
    .refine(val => val >= 0, { message: 'Valor debe ser mayor o igual a 0' }),
  validFrom: z.string().refine(val => !Number.isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }),
  validUntil: z.string().refine(val => !Number.isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }),
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
  isActive: z.string().or(z.boolean()).optional().transform(parseIsActive),
});

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

interface ProcessRowResult {
  success: boolean;
  warning?: string;
  error?: string;
}

// Parse isActive field
function parseIsActive(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const normalized = val.toLowerCase().trim();
    const truthyValues = ['true', '1', 'yes', 'si', 'sí'];
    return truthyValues.includes(normalized);
  }
  return true;
}

// Validate date range
function validateDateRange(validFrom: Date, validUntil: Date): string | null {
  if (validUntil <= validFrom) {
    return 'La fecha de fin debe ser posterior a la fecha de inicio';
  }
  return null;
}

// Validate coupon value based on type
function validateCouponValue(type: CouponType, value: number): string | undefined {
  if (type === 'PERCENTAGE' && value > 100) {
    return 'Valor de porcentaje mayor a 100% - se importará igual';
  }
  return undefined;
}

// 1. Authentication verification
async function verifyAdminAuth(
  req: NextRequest,
): Promise<{ success: false; response: NextResponse } | { success: true; userId: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (adminUser?.role !== 'ADMIN') {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 }),
    };
  }

  return { success: true, userId: adminUser.id };
}

// 2. Data validation
function validateImportData(body: { data?: unknown; options?: unknown }):
  | {
      success: false;
      response: NextResponse;
    }
  | {
      success: true;
      data: unknown[];
      options: { skipDuplicates?: boolean };
    } {
  const { data, options = {} } = body;

  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'No se proporcionaron datos para importar' },
        { status: 400 },
      ),
    };
  }

  const requiredColumns = ['code', 'type', 'value', 'validFrom', 'validUntil'];
  const firstRow = data[0] as Record<string, unknown>;
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` },
        { status: 400 },
      ),
    };
  }

  return {
    success: true,
    data,
    options: options as { skipDuplicates?: boolean },
  };
}

// 3. Validate and parse row data
function parseCouponRowData(row: Record<string, unknown>): z.infer<typeof couponImportSchema> {
  return couponImportSchema.parse({
    code: String(row.code ?? '')
      .trim()
      .toUpperCase(),
    type: String(row.type ?? '').toUpperCase() as CouponType,
    value: row.value,
    validFrom: String(row.validFrom ?? '').trim(),
    validUntil: String(row.validUntil ?? '').trim(),
    maxUses: row.maxUses,
    minOrderAmount: row.minOrderAmount,
    isActive: row.isActive,
  });
}

// 4. Check for duplicate code
function checkDuplicateCode(
  code: string,
  existingCodes: Set<string>,
  skipDuplicates: boolean | undefined,
): ProcessRowResult | null {
  if (existingCodes.has(code)) {
    if (skipDuplicates) {
      return {
        success: false,
        warning: `Código ${code} ya existe - omitido`,
      };
    }
    return {
      success: false,
      error: `Código ${code} ya existe`,
    };
  }
  return null;
}

// 5. Build coupon create data
function buildCouponCreateData(validatedData: z.infer<typeof couponImportSchema>, validFrom: Date, validUntil: Date) {
  return {
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
  };
}

// 6. Row processing
async function processCouponRow(
  row: Record<string, unknown>,
  options: { skipDuplicates?: boolean },
  existingCodes: Set<string>,
): Promise<ProcessRowResult> {
  const validatedData = parseCouponRowData(row);

  // Check for duplicate code
  const duplicateCheck = checkDuplicateCode(validatedData.code, existingCodes, options.skipDuplicates);
  if (duplicateCheck) return duplicateCheck;

  // Parse dates
  const validFrom = new Date(validatedData.validFrom);
  const validUntil = new Date(validatedData.validUntil);

  // Validate date range
  const dateError = validateDateRange(validFrom, validUntil);
  if (dateError) {
    return { success: false, error: dateError };
  }

  // Validate value based on type
  const warning = validateCouponValue(validatedData.type, validatedData.value);

  // Create coupon
  await prisma.coupon.create({
    data: buildCouponCreateData(validatedData, validFrom, validUntil),
  });

  // Add to existing codes set
  existingCodes.add(validatedData.code);

  return { success: true, warning };
}

// 7. Handle row processing error
function handleRowError(error: unknown): { message: string } {
  if (error instanceof z.ZodError) {
    return { message: error.errors[0]?.message || 'Error de validación' };
  }
  return { message: error instanceof Error ? error.message : 'Error desconocido' };
}

// 8. Simplified POST handler
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(req);
    if (!auth.success) return auth.response;

    // Parse and validate request body
    const body = await req.json();
    const validation = validateImportData(body);
    if (!validation.success) return validation.response;

    const { data, options } = validation;

    // Initialize result
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    // Get existing codes to check for duplicates
    const existingCodes = new Set(
      (await prisma.coupon.findMany({ select: { code: true } })).map(c => c.code.toUpperCase()),
    );

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNumber = i + 1;

      try {
        const processResult = await processCouponRow(row, options, existingCodes);

        if (processResult.success) {
          result.imported++;
          if (processResult.warning) {
            result.warnings.push({ row: rowNumber, message: processResult.warning });
          }
        } else if (processResult.warning) {
          result.warnings.push({ row: rowNumber, message: processResult.warning });
        } else if (processResult.error) {
          result.errors.push({ row: rowNumber, message: processResult.error });
        }
      } catch (error) {
        const { message } = handleRowError(error);
        result.errors.push({ row: rowNumber, message });
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
