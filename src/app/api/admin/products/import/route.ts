/**
 * API de Importación CSV de Productos
 * POST /api/admin/products/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { parse } from 'csv-parse/sync';
import type { Material } from '@prisma/client';
import { translateErrorMessage } from '@/lib/i18n';

// Campos requeridos para products.csv
const REQUIRED_COLUMNS = ['name', 'description', 'price', 'stock', 'category', 'material', 'slug'];

// Tipos de movimiento permitidos
const VALID_MATERIALS = ['PLA', 'PETG'];

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

// Validar una fila de producto
async function validateProductRow(
  row: Record<string, string>,
  rowNumber: number,
  existingSlugs: Set<string>,
  existingCategories: Map<string, string>,
): Promise<CSVPreviewRow> {
  const errors: string[] = [];
  const data = { ...row };

  // Validar campos requeridos
  if (!data.name?.trim()) errors.push('El nombre es obligatorio');
  if (!data.description?.trim()) errors.push('La descripción es obligatoria');
  if (!data.slug?.trim()) errors.push('El slug es obligatorio');
  if (!data.category?.trim()) errors.push('La categoría es obligatoria');

  // Validar precio
  const price = Number.parseFloat(data.price);
  if (Number.isNaN(price) || price <= 0) {
    errors.push('El precio debe ser un número positivo');
  }

  // Validar stock
  const stock = Number.parseInt(data.stock, 10);
  if (Number.isNaN(stock) || stock < 0) {
    errors.push('El stock debe ser un número entero no negativo');
  }

  // Validar material
  const material = data.material?.toUpperCase().trim();
  if (!material || !VALID_MATERIALS.includes(material)) {
    errors.push(`Material inválido. Valores permitidos: ${VALID_MATERIALS.join(', ')}`);
  }

  // Validar slug único (localmente y en BD)
  const slug = data.slug?.toLowerCase().trim();
  if (slug) {
    if (existingSlugs.has(slug)) {
      errors.push(`El slug '${slug}' ya existe en el CSV`);
    }
    existingSlugs.add(slug);
  }

  // Validar categoría existe
  const categorySlug = data.category?.toLowerCase().trim();
  if (categorySlug && !existingCategories.has(categorySlug)) {
    errors.push(`La categoría '${data.category}' no existe`);
  }

  return {
    row: rowNumber,
    data,
    errors,
    valid: errors.length === 0,
  };
}

// POST - Importar productos desde CSV
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
    const mode = (formData.get('mode') as string) || 'preview'; // 'preview' o 'import'

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

    // Obtener categorías existentes
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    // Validar todas las filas
    const previewRows: CSVPreviewRow[] = [];
    const validRows: CSVPreviewRow[] = [];
    const csvSlugs = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const validated = await validateProductRow(records[i], i + 2, csvSlugs, categoryMap); // +2 porque fila 1 es header
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
        preview: previewRows.slice(0, 10), // Primeros 10 registros
        headers,
      });
    }

    // Modo import: Insertar en BD
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
          // Verificar si el slug ya existe (por si acaso)
          const exists = await tx.product.findUnique({
            where: { slug: data.slug.toLowerCase().trim() },
            select: { id: true },
          });

          if (exists) {
            result.skipped++;
            result.errors.push({
              row: row.row,
              errors: [`El producto con slug '${data.slug}' ya existe`],
              data,
            });
            continue;
          }

          // Crear producto
          const categoryId = categoryMap.get(data.category.toLowerCase().trim());
          if (!categoryId) {
            result.skipped++;
            result.errors.push({
              row: row.row,
              errors: [`Categoría '${data.category}' no encontrada`],
              data,
            });
            continue;
          }

          await tx.product.create({
            data: {
              id: crypto.randomUUID(),
              slug: data.slug.toLowerCase().trim(),
              name: data.name.trim(),
              description: data.description.trim(),
              shortDescription: data.shortDescription?.trim() || null,
              price: Number.parseFloat(data.price),
              stock: Number.parseInt(data.stock, 10),
              categoryId,
              material: data.material.toUpperCase().trim() as Material,
              widthCm: data.widthCm ? Number.parseFloat(data.widthCm) : null,
              heightCm: data.heightCm ? Number.parseFloat(data.heightCm) : null,
              depthCm: data.depthCm ? Number.parseFloat(data.depthCm) : null,
              weight: data.weight ? Number.parseFloat(data.weight) : null,
              printTime: data.printTime ? Number.parseInt(data.printTime, 10) : null,
              isActive: data.isActive?.toLowerCase() !== 'false',
              isFeatured: data.isFeatured?.toLowerCase() === 'true',
              minStock: data.minStock ? Number.parseInt(data.minStock, 10) : 5,
            },
          });

          result.imported++;
        } catch (error) {
          result.errors.push({
            row: row.row,
            errors: [`Error al crear producto: ${(error as Error).message}`],
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
    console.error('Error importando productos:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
