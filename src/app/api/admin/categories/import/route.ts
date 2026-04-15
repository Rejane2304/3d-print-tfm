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

// Helper para validar y procesar CSV
function parseCSV(buffer: Buffer): { records: Record<string, string>[]; headers: string[] } {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    throw new Error('El archivo CSV está vacío');
  }

  const headers = Object.keys(records[0]);
  return { records, headers };
}

// Validar columnas requeridas
function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  return { valid: missing.length === 0, missing };
}

// Validar una fila de categoría
async function validateCategoryRow(
  row: Record<string, string>,
  rowNumber: number,
  existingSlugs: Set<string>,
  csvSlugs: Set<string>,
): Promise<CSVPreviewRow> {
  const errors: string[] = [];
  const data = { ...row };

  // Validar campos requeridos
  if (!data.name?.trim()) errors.push('El nombre es obligatorio');
  if (!data.description?.trim()) errors.push('La descripción es obligatoria');
  if (!data.slug?.trim()) errors.push('El slug es obligatorio');

  // Validar longitudes
  if (data.name && data.name.length > 100) errors.push('El nombre debe tener máximo 100 caracteres');
  if (data.description && data.description.length > 500) {
    errors.push('La descripción debe tener máximo 500 caracteres');
  }
  if (data.slug && data.slug.length > 100) errors.push('El slug debe tener máximo 100 caracteres');

  // Validar slug (solo letras, números, guiones)
  const slug = data.slug?.toLowerCase().trim();
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.push('El slug solo puede contener letras minúsculas, números y guiones');
  }

  // Validar slug único
  if (slug) {
    if (existingSlugs.has(slug)) {
      errors.push(`El slug '${slug}' ya existe en la base de datos`);
    } else if (csvSlugs.has(slug)) {
      errors.push(`El slug '${slug}' está duplicado en el CSV`);
    } else {
      csvSlugs.add(slug);
    }
  }

  // Validar displayOrder si existe
  if (data.displayOrder) {
    const order = Number.parseInt(data.displayOrder, 10);
    if (Number.isNaN(order) || order < 0) {
      errors.push('El orden de visualización debe ser un número entero no negativo');
    }
  }

  return {
    row: rowNumber,
    data,
    errors,
    valid: errors.length === 0,
  };
}

// POST - Importar categorías desde CSV
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 403 });
    }

    // Leer el archivo CSV
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'preview';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'El archivo debe ser un CSV' }, { status: 400 });
    }

    // Leer contenido del archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parsear CSV
    let records: Record<string, string>[];
    let headers: string[];
    try {
      const result = parseCSV(buffer);
      records = result.records;
      headers = result.headers;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Error al parsear CSV: ${(error as Error).message}` },
        { status: 400 },
      );
    }

    // Validar columnas requeridas
    const columnValidation = validateColumns(headers);
    if (!columnValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Columnas faltantes: ${columnValidation.missing.join(', ')}`,
          requiredColumns: REQUIRED_COLUMNS,
          foundColumns: headers,
        },
        { status: 400 },
      );
    }

    // Obtener slugs existentes
    const existingCategories = await prisma.category.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existingCategories.map(c => c.slug));

    // Validar todas las filas
    const previewRows: CSVPreviewRow[] = [];
    const validRows: CSVPreviewRow[] = [];
    const csvSlugs = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const validated = await validateCategoryRow(records[i], i + 2, existingSlugs, csvSlugs);
      previewRows.push(validated);
      if (validated.valid) {
        validRows.push(validated);
      }
    }

    // Si es solo preview, retornar información
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

    // Modo import
    if (validRows.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay registros válidos para importar' }, { status: 400 });
    }

    const result: ImportResult = {
      imported: 0,
      errors: [],
      skipped: 0,
    };

    // Importar en transacción
    await prisma.$transaction(async tx => {
      for (const row of validRows) {
        const data = row.data;

        try {
          // Verificar si el slug ya existe
          const exists = await tx.category.findUnique({
            where: { slug: data.slug.toLowerCase().trim() },
            select: { id: true },
          });

          if (exists) {
            result.skipped++;
            result.errors.push({
              row: row.row,
              errors: [`La categoría con slug '${data.slug}' ya existe`],
              data,
            });
            continue;
          }

          // Crear categoría
          await tx.category.create({
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
        } catch (error) {
          result.errors.push({
            row: row.row,
            errors: [`Error al crear categoría: ${(error as Error).message}`],
            data,
          });
        }
      }
    });

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
