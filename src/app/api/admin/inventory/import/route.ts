/**
 * API de Importación CSV de Inventario
 * POST /api/admin/inventory/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { parse } from 'csv-parse/sync';
import type { MovementType } from '@prisma/client';
import { translateErrorMessage } from '@/lib/i18n';

// Campos requeridos para inventory.csv
const REQUIRED_COLUMNS = ['productSlug', 'quantity', 'type', 'reason'];

// Tipos de movimiento permitidos
const VALID_MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];

interface CSVPreviewRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
  productInfo?: { id: string; name: string; currentStock: number };
}

interface ImportResult {
  imported: number;
  errors: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
  skipped: number;
}

interface ValidationContext {
  productsMap: Map<string, { id: string; name: string; currentStock: number }>;
}

// Helper para validar y procesar CSV
function parseCSV(buffer: Buffer): { records: Record<string, string>[]; headers: string[] } {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

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

// Validar campos requeridos
function validateRequiredFields(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.productSlug?.trim()) errors.push('El slug del producto es obligatorio');
  if (!data.quantity?.trim()) errors.push('La cantidad es obligatoria');
  if (!data.type?.trim()) errors.push('El tipo de movimiento es obligatorio');
  if (!data.reason?.trim()) errors.push('El motivo es obligatorio');
  return errors;
}

// Validar cantidad
function validateQuantity(quantityStr: string): { valid: boolean; error?: string; quantity?: number } {
  const quantity = Number.parseInt(quantityStr, 10);
  if (Number.isNaN(quantity) || quantity <= 0) {
    return { valid: false, error: 'La cantidad debe ser un número entero positivo' };
  }
  return { valid: true, quantity };
}

// Validar tipo de movimiento
function validateMovementType(type: string): { valid: boolean; error?: string; normalizedType?: string } {
  const normalizedType = type.toUpperCase().trim();
  if (!VALID_MOVEMENT_TYPES.includes(normalizedType)) {
    return {
      valid: false,
      error: `Tipo de movimiento inválido. Valores permitidos: ${VALID_MOVEMENT_TYPES.join(', ')}`,
    };
  }
  return { valid: true, normalizedType };
}

// Validar stock para movimiento OUT
function validateStockForOut(
  type: string,
  quantity: number,
  productInfo: { currentStock: number } | undefined,
): string | null {
  if (type === 'OUT' && productInfo && quantity > productInfo.currentStock) {
    return `Stock insuficiente para reducir. Stock actual: ${productInfo.currentStock}, Cantidad a reducir: ${quantity}`;
  }
  return null;
}

// Buscar producto en el mapa
function findProduct(
  productSlug: string,
  productsMap: Map<string, { id: string; name: string; currentStock: number }>,
): { id: string; name: string; currentStock: number } | undefined {
  const normalizedSlug = productSlug.toLowerCase().trim();
  return productsMap.get(normalizedSlug);
}

// Validar una fila de inventario
async function validateInventoryRow(
  row: Record<string, string>,
  rowNumber: number,
  context: ValidationContext,
): Promise<CSVPreviewRow> {
  const errors: string[] = [];
  const data = { ...row };

  // Validar campos requeridos
  errors.push(...validateRequiredFields(data));

  // Validar cantidad
  let quantity: number | undefined;
  if (data.quantity) {
    const quantityValidation = validateQuantity(data.quantity);
    if (!quantityValidation.valid) {
      errors.push(quantityValidation.error!);
    } else {
      quantity = quantityValidation.quantity;
    }
  }

  // Validar tipo de movimiento
  let type: string | undefined;
  if (data.type) {
    const typeValidation = validateMovementType(data.type);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error!);
    } else {
      type = typeValidation.normalizedType;
    }
  }

  // Validar que el producto existe
  let productInfo: { id: string; name: string; currentStock: number } | undefined;
  if (data.productSlug) {
    productInfo = findProduct(data.productSlug, context.productsMap);
    if (!productInfo) {
      errors.push(`No existe un producto con el slug '${data.productSlug}'`);
    } else if (quantity && type) {
      // Validar stock suficiente para OUT
      const stockError = validateStockForOut(type, quantity, productInfo);
      if (stockError) errors.push(stockError);
    }
  }

  return {
    row: rowNumber,
    data,
    errors,
    valid: errors.length === 0,
    productInfo,
  };
}

// Calcular nuevo stock basado en el tipo de movimiento
function calculateNewStock(type: MovementType, currentStock: number, quantity: number): number {
  switch (type) {
    case 'IN':
      return currentStock + quantity;
    case 'OUT':
      return currentStock - quantity;
    case 'ADJUSTMENT':
      return quantity; // En ajuste, quantity es el stock final
    default:
      return currentStock;
  }
}

// Calcular cantidad absoluta del movimiento
function calculateMovementQuantity(type: MovementType, newStock: number, previousStock: number): number {
  if (type === 'ADJUSTMENT') {
    return Math.abs(newStock - previousStock);
  }
  return Math.abs(newStock - previousStock);
}

// Crear datos del movimiento de inventario
function buildInventoryMovementData(
  productId: string,
  type: MovementType,
  quantity: number,
  previousStock: number,
  newStock: number,
  reason: string,
  reference: string | undefined,
  rowNumber: number,
  userId: string,
) {
  return {
    id: crypto.randomUUID(),
    productId,
    type,
    quantity: calculateMovementQuantity(type, newStock, previousStock),
    previousStock,
    newStock,
    reason: reason.trim(),
    reference: reference?.trim() || `CSV_IMPORT_${rowNumber}`,
    createdBy: userId,
  };
}

// Procesar una fila de inventario
async function processInventoryRow(
  tx: {
    product: { update: typeof prisma.product.update };
    inventoryMovement: { create: typeof prisma.inventoryMovement.create };
  },
  row: CSVPreviewRow,
  userId: string,
  result: ImportResult,
): Promise<void> {
  const data = row.data;
  const productInfo = row.productInfo;

  if (!productInfo) {
    result.skipped++;
    return;
  }

  try {
    const quantity = Number.parseInt(data.quantity, 10);
    const type = data.type.toUpperCase().trim() as MovementType;

    // Calcular nuevo stock
    const newStock = Math.max(0, calculateNewStock(type, productInfo.currentStock, quantity));

    // Actualizar stock del producto
    await tx.product.update({
      where: { id: productInfo.id },
      data: { stock: newStock },
    });

    // Crear movimiento de inventario
    await tx.inventoryMovement.create({
      data: buildInventoryMovementData(
        productInfo.id,
        type,
        quantity,
        productInfo.currentStock,
        newStock,
        data.reason,
        data.reference,
        row.row,
        userId,
      ),
    });

    // Actualizar el stock en el mapa para siguientes operaciones
    productInfo.currentStock = newStock;

    result.imported++;
  } catch (error) {
    result.errors.push({
      row: row.row,
      errors: [`Error al procesar movimiento: ${(error as Error).message}`],
      data,
    });
  }
}

// Importar movimientos en transacción
async function importInventoryMovements(validRows: CSVPreviewRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    errors: [],
    skipped: 0,
  };

  await prisma.$transaction(async tx => {
    for (const row of validRows) {
      await processInventoryRow(tx, row, userId, result);
    }
  });

  return result;
}

// POST - Importar movimientos de inventario desde CSV
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

    // Obtener productos existentes
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, name: true, stock: true },
    });
    const productsMap = new Map<string, { id: string; name: string; currentStock: number }>(
      products.map(p => [p.slug, { id: p.id, name: p.name, currentStock: p.stock }]),
    );

    // Validar todas las filas
    const previewRows: CSVPreviewRow[] = [];
    const validRows: CSVPreviewRow[] = [];
    const context: ValidationContext = { productsMap };

    for (let i = 0; i < records.length; i++) {
      const validated = await validateInventoryRow(records[i], i + 2, context);
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
        preview: previewRows.slice(0, 10).map(row => ({
          ...row,
          productInfo: row.productInfo
            ? {
                name: row.productInfo.name,
                currentStock: row.productInfo.currentStock,
              }
            : undefined,
        })),
        headers,
      });
    }

    // Modo import
    if (validRows.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay registros válidos para importar' }, { status: 400 });
    }

    const result = await importInventoryMovements(validRows, user.id);

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
    console.error('Error importando inventario:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
