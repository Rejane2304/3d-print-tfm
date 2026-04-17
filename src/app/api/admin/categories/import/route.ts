/**
 * API de Importación CSV de Categorías
 * POST /api/admin/categories/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { parse } from 'csv-parse/sync';
import { translateErrorMessage } from '@/lib/i18n';

// Campos requeridos para categories.csv
const REQUIRED_COLUMNS = ['name', 'description', 'slug'];

interface CSVPreviewRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

interface ImportResult {
  imported: number;
  errors: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
  skipped: number;
}

interface ValidationContext {
  existingSlugs: Set<string>;
  csvSlugs: Set<string>;
}

// 1. Authentication verification
async function verifyAdminAuth(
  req: NextRequest,
): Promise<{ success: false; response: NextResponse } | { success: true; userId: string }> {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session?.user?.email) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user?.role !== 'ADMIN') {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 403 }),
    };
  }

  return { success: true, userId: user.id };
}

// 2. Parse and validate CSV file
async function parseAndValidateCSV(
  file: File,
): Promise<
  { success: false; response: NextResponse } | { success: true; records: Record<string, string>[]; headers: string[] }
> {
  if (!file.name.endsWith('.csv')) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'El archivo debe ser un CSV' }, { status: 400 }),
    };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let records: Record<string, string>[];
  let headers: string[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('El archivo CSV está vacío');
    }

    headers = Object.keys(records[0]);
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Error al parsear CSV: ${(error as Error).message}` },
        { status: 400 },
      ),
    };
  }

  // Validate required columns
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missing.length > 0) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Columnas faltantes: ${missing.join(', ')}`,
          requiredColumns: REQUIRED_COLUMNS,
          foundColumns: headers,
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, records, headers };
}

// 3. Field validators
function validateRequiredFields(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('El nombre es obligatorio');
  if (!data.description?.trim()) errors.push('La descripción es obligatoria');
  if (!data.slug?.trim()) errors.push('El slug es obligatorio');
  return errors;
}

function validateFieldLengths(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (data.name && data.name.length > 100) errors.push('El nombre debe tener máximo 100 caracteres');
  if (data.description && data.description.length > 500) {
    errors.push('La descripción debe tener máximo 500 caracteres');
  }
  if (data.slug && data.slug.length > 100) errors.push('El slug debe tener máximo 100 caracteres');
  return errors;
}

function validateSlugFormat(slug: string): string | null {
  const normalizedSlug = slug.toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return 'El slug solo puede contener letras minúsculas, números y guiones';
  }
  return null;
}

function validateSlugUniqueness(slug: string, context: ValidationContext): string | null {
  const normalizedSlug = slug.toLowerCase().trim();
  if (context.existingSlugs.has(normalizedSlug)) {
    return `El slug '${slug}' ya existe en la base de datos`;
  }
  if (context.csvSlugs.has(normalizedSlug)) {
    return `El slug '${slug}' está duplicado en el CSV`;
  }
  return null;
}

function validateDisplayOrder(data: Record<string, string>): string | null {
  if (data.displayOrder) {
    const order = Number.parseInt(data.displayOrder, 10);
    if (Number.isNaN(order) || order < 0) {
      return 'El orden de visualización debe ser un número entero no negativo';
    }
  }
  return null;
}

// 4. Validate a single category row
async function validateCategoryRow(
  row: Record<string, string>,
  rowNumber: number,
  context: ValidationContext,
): Promise<CSVPreviewRow> {
  const errors: string[] = [];
  const data = { ...row };

  // Validar campos requeridos
  errors.push(...validateRequiredFields(data));

  // Validar longitudes
  errors.push(...validateFieldLengths(data));

  // Validar slug (solo letras, números, guiones)
  const slug = data.slug?.toLowerCase().trim();
  if (slug) {
    const formatError = validateSlugFormat(data.slug);
    if (formatError) errors.push(formatError);

    // Validar slug único
    const uniquenessError = validateSlugUniqueness(data.slug, context);
    if (uniquenessError) {
      errors.push(uniquenessError);
    } else {
      context.csvSlugs.add(slug);
    }
  }

  // Validar displayOrder si existe
  const displayOrderError = validateDisplayOrder(data);
  if (displayOrderError) errors.push(displayOrderError);

  return {
    row: rowNumber,
    data,
    errors,
    valid: errors.length === 0,
  };
}

// 5. Create category data helper
function buildCategoryCreateData(data: Record<string, string>): {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
} {
  return {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    slug: data.slug.toLowerCase().trim(),
    description: data.description.trim() || null,
    image: data.image?.trim() || null,
    displayOrder: data.displayOrder ? Number.parseInt(data.displayOrder, 10) : 0,
    isActive: data.isActive?.toLowerCase() !== 'false',
  };
}

// 6. Check if category exists
async function checkCategoryExists(
  tx: { category: { findUnique: typeof prisma.category.findUnique } },
  slug: string,
): Promise<boolean> {
  const exists = await tx.category.findUnique({
    where: { slug: slug.toLowerCase().trim() },
    select: { id: true },
  });
  return !!exists;
}

// 7. Import a single category
async function importSingleCategory(
  tx: { category: { findUnique: typeof prisma.category.findUnique; create: typeof prisma.category.create } },
  row: CSVPreviewRow,
  result: ImportResult,
): Promise<void> {
  const data = row.data;

  try {
    const exists = await checkCategoryExists(tx, data.slug);

    if (exists) {
      result.skipped++;
      result.errors.push({
        row: row.row,
        errors: [`La categoría con slug '${data.slug}' ya existe`],
        data,
      });
      return;
    }

    await tx.category.create({
      data: buildCategoryCreateData(data),
    });

    result.imported++;
  } catch (error) {
    result.errors.push({
      row: row.row,
      errors: [`Error al crear categoría: ${(error as Error).message}`],
      data,
    });
  }
}

// 8. Import categories in transaction
async function importCategories(validRows: CSVPreviewRow[], result: ImportResult): Promise<void> {
  await prisma.$transaction(async tx => {
    for (const row of validRows) {
      await importSingleCategory(tx, row, result);
    }
  });
}

// 9. Simplified POST handler
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(req);
    if (!auth.success) return auth.response;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'preview';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Parse and validate CSV
    const csvValidation = await parseAndValidateCSV(file);
    if (!csvValidation.success) return csvValidation.response;

    const { records, headers } = csvValidation;

    // Get existing slugs
    const existingCategories = await prisma.category.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set<string>(existingCategories.map(c => c.slug));

    // Validate all rows
    const previewRows: CSVPreviewRow[] = [];
    const validRows: CSVPreviewRow[] = [];
    const csvSlugs = new Set<string>();
    const context: ValidationContext = { existingSlugs, csvSlugs };

    for (let i = 0; i < records.length; i++) {
      const validated = await validateCategoryRow(records[i], i + 2, context);
      previewRows.push(validated);
      if (validated.valid) {
        validRows.push(validated);
      }
    }

    // Preview mode
    if (mode === 'preview') {
      return NextResponse.json({
        success: true,
        mode: 'preview',
        totalRows: records.length,
        validRows: validRows.length,
        invalidRows: previewRows.filter(r => !r.valid).length,
        preview: previewRows.slice(0, 10),
        headers,
      });
    }

    // Import mode
    if (validRows.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay registros válidos para importar' }, { status: 400 });
    }

    const result: ImportResult = {
      imported: 0,
      errors: [],
      skipped: 0,
    };

    await importCategories(validRows, result);

    return NextResponse.json({
      success: true,
      mode: 'import',
      result: {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors.length,
        errorDetails: result.errors,
      },
    });
  } catch (error) {
    console.error('Error importando categorías:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
