/**
 * Coupons Import Processor
 * Contains all logic separated from route
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { CouponType } from '@prisma/client';

const couponImportSchema = z.object({
  code: z.string().min(3, 'Código debe tener al menos 3 caracteres').max(50, 'Máximo 50 caracteres'),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Tipo debe ser PERCENTAGE, FIXED o FREE_SHIPPING' }),
  }),
  value: z.coerce.number().refine(val => val >= 0, { message: 'Valor debe ser mayor o igual a 0' }),
  validFrom: z.string().refine(val => !Number.isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }),
  validUntil: z.string().refine(val => !Number.isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }),
  maxUses: z.coerce
    .number()
    .optional()
    .transform(val => (val ? val : null)),
  minOrderAmount: z.coerce
    .number()
    .optional()
    .transform(val => (val ? val : null)),
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

// Main processor function
export async function processCouponsImport(req: NextRequest): Promise<Response> {
  const authError = await verifyAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const validation = validateRequestBody(body);
  if (validation instanceof NextResponse) return validation;

  const result: ImportResult = { success: true, imported: 0, errors: [], warnings: [] };
  await processAllRows(validation.data, validation.options, result);

  return NextResponse.json(buildResponse(result));
}

// Authentication
async function verifyAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (adminUser?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  }
  return null;
}

// Validate request body
function validateRequestBody(body: {
  data?: unknown;
  options?: unknown;
}): { data: unknown[]; options: { skipDuplicates?: boolean } } | NextResponse {
  const { data, options = {} } = body;

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
  }

  const requiredColumns = ['code', 'type', 'value', 'validFrom', 'validUntil'];
  const firstRow = data[0] as Record<string, unknown>;
  const missing = requiredColumns.filter(col => !(col in firstRow));

  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Columnas requeridas faltantes: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  return { data, options: options as { skipDuplicates?: boolean } };
}

// Parse row data
function parseCouponRow(row: Record<string, unknown>): z.infer<typeof couponImportSchema> {
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

// Validate date range
function validateDateRange(validFrom: Date, validUntil: Date): string | null {
  if (validUntil <= validFrom) return 'La fecha de fin debe ser posterior a la fecha de inicio';
  return null;
}

// Validate coupon value
function validateCouponValue(type: CouponType, value: number): string | undefined {
  if (type === 'PERCENTAGE' && value > 100) return 'Valor de porcentaje mayor a 100% - se importará igual';
  return undefined;
}

// Check duplicate code
function checkDuplicateCode(
  code: string,
  existingCodes: Set<string>,
  skipDuplicates?: boolean,
): ProcessRowResult | null {
  if (!existingCodes.has(code)) return null;
  if (skipDuplicates) return { success: false, warning: `Código ${code} ya existe - omitido` };
  return { success: false, error: `Código ${code} ya existe` };
}

// Create coupon
async function createCoupon(validatedData: z.infer<typeof couponImportSchema>, validFrom: Date, validUntil: Date) {
  return prisma.coupon.create({
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
}

// Process single row
async function processCouponRow(
  row: Record<string, unknown>,
  options: { skipDuplicates?: boolean },
  existingCodes: Set<string>,
): Promise<ProcessRowResult> {
  const validatedData = parseCouponRow(row);

  const duplicateCheck = checkDuplicateCode(validatedData.code, existingCodes, options.skipDuplicates);
  if (duplicateCheck) return duplicateCheck;

  const validFrom = new Date(validatedData.validFrom);
  const validUntil = new Date(validatedData.validUntil);

  const dateError = validateDateRange(validFrom, validUntil);
  if (dateError) return { success: false, error: dateError };

  const warning = validateCouponValue(validatedData.type, validatedData.value);

  await createCoupon(validatedData, validFrom, validUntil);
  existingCodes.add(validatedData.code);

  return { success: true, warning };
}

// Handle error
function handleRowError(error: unknown): string {
  if (error instanceof z.ZodError) return error.errors[0]?.message || 'Error de validación';
  return error instanceof Error ? error.message : 'Error desconocido';
}

// Get existing codes
async function getExistingCodes(): Promise<Set<string>> {
  const coupons = await prisma.coupon.findMany({ select: { code: true } });
  return new Set(coupons.map(c => c.code.toUpperCase()));
}

// Process all rows
async function processAllRows(
  data: unknown[],
  options: { skipDuplicates?: boolean },
  result: ImportResult,
): Promise<void> {
  const existingCodes = await getExistingCodes();

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, unknown>;
    const rowNumber = i + 1;

    try {
      const processResult = await processCouponRow(row, options, existingCodes);

      if (processResult.success) {
        result.imported++;
        if (processResult.warning) result.warnings.push({ row: rowNumber, message: processResult.warning });
      } else if (processResult.warning) {
        result.warnings.push({ row: rowNumber, message: processResult.warning });
      } else if (processResult.error) {
        result.errors.push({ row: rowNumber, message: processResult.error });
      }
    } catch (error) {
      result.errors.push({ row: rowNumber, message: handleRowError(error) });
    }
  }
}

// Build response
function buildResponse(result: ImportResult) {
  return {
    ...result,
    success: result.errors.length === 0,
    message:
      result.imported > 0 ? `${result.imported} cupones importados exitosamente` : 'No se pudo importar ningún cupón',
  };
}
