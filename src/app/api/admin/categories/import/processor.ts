/**
 * Categories Import Processor
 * Contains all logic separated from route
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { parse } from 'csv-parse/sync';
import { translateErrorMessage } from '@/lib/i18n';

const REQUIRED_COLUMNS = ['name', 'description', 'slug'];

interface ImportResult {
  imported: number;
  errors: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
  skipped: number;
}

// Main processor function
export async function processCategoriesImport(req: NextRequest): Promise<Response> {
  const authError = await checkAuth(req);
  if (authError) return authError;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mode = (formData.get('mode') as string) || 'preview';

  if (!file) {
    return NextResponse.json({ success: false, error: 'No se proporcionó archivo' }, { status: 400 });
  }

  const parseResult = await parseCSVFile(file);
  if (parseResult instanceof NextResponse) return parseResult;

  const { records, headers } = parseResult;
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Columnas faltantes: ${missingColumns.join(', ')}`,
        requiredColumns: REQUIRED_COLUMNS,
        foundColumns: headers,
      },
      { status: 400 },
    );
  }

  const existingSlugs = await getExistingSlugs();
  const { previewRows, validRows } = await validateAllRows(records, existingSlugs);

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

  if (validRows.length === 0) {
    return NextResponse.json({ success: false, error: 'No hay registros válidos' }, { status: 400 });
  }

  const result: ImportResult = { imported: 0, errors: [], skipped: 0 };
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
}

// Auth check
async function checkAuth(req: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 403 });
  }

  return null;
}

// CSV Parsing
async function parseCSVFile(
  file: File,
): Promise<{ records: Record<string, string>[]; headers: string[] } | NextResponse> {
  if (!file.name.endsWith('.csv')) {
    return NextResponse.json({ success: false, error: 'El archivo debe ser un CSV' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('El archivo CSV está vacío');
    }

    return { records, headers: Object.keys(records[0]) };
  } catch {
    return NextResponse.json({ success: false, error: 'Error al parsear CSV' }, { status: 400 });
  }
}

// Get existing slugs
async function getExistingSlugs(): Promise<Set<string>> {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return new Set(categories.map(c => c.slug));
}

// Validate all rows
async function validateAllRows(
  records: Record<string, string>[],
  existingSlugs: Set<string>,
): Promise<{
  previewRows: Array<{ row: number; data: Record<string, string>; errors: string[]; valid: boolean }>;
  validRows: Array<{ row: number; data: Record<string, string> }>;
}> {
  const previewRows: Array<{ row: number; data: Record<string, string>; errors: string[]; valid: boolean }> = [];
  const validRows: Array<{ row: number; data: Record<string, string> }> = [];
  const csvSlugs = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const errors = validateSingleRow(records[i], existingSlugs, csvSlugs);
    const valid = errors.length === 0;

    previewRows.push({ row: i + 2, data: records[i], errors, valid });

    if (valid) {
      validRows.push({ row: i + 2, data: records[i] });
      csvSlugs.add(records[i].slug?.toLowerCase().trim() || '');
    }
  }

  return { previewRows, validRows };
}

// Validate single row
function validateSingleRow(data: Record<string, string>, existingSlugs: Set<string>, csvSlugs: Set<string>): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.name?.trim()) errors.push('El nombre es obligatorio');
  if (!data.description?.trim()) errors.push('La descripción es obligatoria');
  if (!data.slug?.trim()) errors.push('El slug es obligatorio');

  // Length validations
  if (data.name && data.name.length > 100) errors.push('Nombre máximo 100 caracteres');
  if (data.description && data.description.length > 500) errors.push('Descripción máximo 500 caracteres');
  if (data.slug && data.slug.length > 100) errors.push('Slug máximo 100 caracteres');

  // Slug format
  const slug = data.slug?.toLowerCase().trim();
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.push('Slug solo puede contener letras minúsculas, números y guiones');
  }

  // Slug uniqueness
  if (slug) {
    if (existingSlugs.has(slug)) errors.push(`El slug '${slug}' ya existe`);
    else if (csvSlugs.has(slug)) errors.push(`El slug '${slug}' está duplicado en el CSV`);
  }

  // Display order
  if (data.displayOrder) {
    const order = Number.parseInt(data.displayOrder, 10);
    if (Number.isNaN(order) || order < 0) errors.push('Orden debe ser un número entero no negativo');
  }

  return errors;
}

// Import categories
async function importCategories(
  validRows: Array<{ row: number; data: Record<string, string> }>,
  result: ImportResult,
): Promise<void> {
  for (const row of validRows) {
    const data = row.data;

    try {
      const exists = await prisma.category.findUnique({
        where: { slug: data.slug.toLowerCase().trim() },
        select: { id: true },
      });

      if (exists) {
        result.skipped++;
        result.errors.push({ row: row.row, errors: [`La categoría '${data.slug}' ya existe`], data });
        continue;
      }

      await prisma.category.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          description: data.description.trim() || null,
          image: data.image?.trim() || null,
          displayOrder: data.displayOrder ? Number.parseInt(data.displayOrder, 10) : 0,
          isActive: data.isActive?.toLowerCase() !== 'false',
        },
      });

      result.imported++;
    } catch {
      result.errors.push({ row: row.row, errors: ['Error al crear categoría'], data });
    }
  }
}
