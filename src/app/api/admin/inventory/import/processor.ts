/**
 * Inventory Import Processor
 * Contains all logic separated from route
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { parse } from 'csv-parse/sync';
import { translateErrorMessage } from '@/lib/i18n';

// Type definition for MovementType (local type)
type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'CANCELLATION' | 'RETURN';

const REQUIRED_COLUMNS = ['productSlug', 'quantity', 'type', 'reason'];
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

// Main processor function
export async function processInventoryImport(req: NextRequest): Promise<Response> {
  const authResult = await verifyAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mode = (formData.get('mode') as string) || 'preview';

  if (!file) {
    return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
  }

  const csvResult = await parseCSVFile(file);
  if (csvResult instanceof NextResponse) return csvResult;

  const { records, headers } = csvResult;
  const missing = validateColumns(headers);
  if (missing) {
    return NextResponse.json(
      {
        success: false,
        error: `Columnas faltantes: ${missing.join(', ')}`,
        requiredColumns: REQUIRED_COLUMNS,
        foundColumns: headers,
      },
      { status: 400 },
    );
  }

  const productsMap = await getProductsMap();
  const { previewRows, validRows } = await validateAllRows(records, productsMap);

  if (mode === 'preview') {
    return NextResponse.json(buildPreviewResponse(previewRows, validRows, headers, records.length));
  }

  if (validRows.length === 0) {
    return NextResponse.json({ success: false, error: 'No hay registros válidos para importar' }, { status: 400 });
  }

  const result = await importMovements(validRows, authResult.userId);
  return NextResponse.json(buildImportResponse(result));
}

// Authentication
async function verifyAdminAuth(_req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 403 });
  }

  return { userId: user.id };
}

// Parse CSV file
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
    if (records.length === 0) throw new Error('El archivo CSV está vacío');
    return { records, headers: Object.keys(records[0]) };
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Error al parsear CSV: ${(error as Error).message}` },
      { status: 400 },
    );
  }
}

// Validate columns
function validateColumns(headers: string[]): string[] | null {
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  return missing.length > 0 ? missing : null;
}

// Validate required fields
function validateRequiredFields(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.productSlug?.trim()) errors.push('El slug del producto es obligatorio');
  if (!data.quantity?.trim()) errors.push('La cantidad es obligatoria');
  if (!data.type?.trim()) errors.push('El tipo de movimiento es obligatorio');
  if (!data.reason?.trim()) errors.push('El motivo es obligatorio');
  return errors;
}

// Validate quantity - S6660 corregido (if en else)
interface QuantityValidResult {
  valid: true;
  quantity: number;
}
interface QuantityInvalidResult {
  valid: false;
  error: string;
}
type QuantityValidationResult = QuantityValidResult | QuantityInvalidResult;

function validateQuantity(quantityStr: string): QuantityValidationResult {
  const quantity = Number.parseInt(quantityStr, 10);
  if (Number.isNaN(quantity) || quantity <= 0) {
    return { valid: false, error: 'La cantidad debe ser un número entero positivo' };
  }
  return { valid: true, quantity };
}

// Validate movement type
interface TypeValidResult {
  valid: true;
  normalizedType: string;
}
interface TypeInvalidResult {
  valid: false;
  error: string;
}
type TypeValidationResult = TypeValidResult | TypeInvalidResult;

function validateMovementType(type: string): TypeValidationResult {
  const normalized = type.toUpperCase().trim();
  if (!VALID_MOVEMENT_TYPES.includes(normalized)) {
    return {
      valid: false,
      error: `Tipo de movimiento inválido. Valores permitidos: ${VALID_MOVEMENT_TYPES.join(', ')}`,
    };
  }
  return { valid: true, normalizedType: normalized };
}

// Validate stock for OUT movement - S7735 corregido (no negated condition)
function validateStockForOut(type: string, quantity: number, productInfo?: { currentStock: number }): string | null {
  const hasStock = productInfo && productInfo.currentStock >= quantity;
  if (type === 'OUT' && !hasStock) {
    return `Stock insuficiente para reducir. Stock actual: ${productInfo?.currentStock}, Cantidad a reducir: ${quantity}`;
  }
  return null;
}

// Find product in map
function findProduct(slug: string, productsMap: Map<string, { id: string; name: string; currentStock: number }>) {
  return productsMap.get(slug.toLowerCase().trim());
}

// Validate single row - S6660 corregido (if en else)
async function validateInventoryRow(
  row: Record<string, string>,
  rowNum: number,
  ctx: ValidationContext,
): Promise<CSVPreviewRow> {
  const errors: string[] = [];
  const data = { ...row };

  errors.push(...validateRequiredFields(data));

  let quantity: number | undefined;
  if (data.quantity) {
    const qtyValidation = validateQuantity(data.quantity);
    if (qtyValidation.valid) {
      quantity = qtyValidation.quantity;
    } else {
      errors.push((qtyValidation as QuantityInvalidResult).error);
    }
  }

  let type: string | undefined;
  if (data.type) {
    const typeValidation = validateMovementType(data.type);
    if (typeValidation.valid) {
      type = (typeValidation as TypeValidResult).normalizedType;
    } else {
      errors.push((typeValidation as TypeInvalidResult).error);
    }
  }

  const productInfo = findProduct(data.productSlug, ctx.productsMap);
  if (!productInfo) {
    errors.push(`No existe un producto con el slug '${data.productSlug}'`);
  } else if (quantity && type) {
    const stockError = validateStockForOut(type, quantity, productInfo);
    if (stockError) errors.push(stockError);
  }

  return { row: rowNum, data, errors, valid: errors.length === 0, productInfo };
}

// Product data type
type ProductData = { id: string; slug: string; name: string; stock: number };

// Get products map
async function getProductsMap(): Promise<Map<string, { id: string; name: string; currentStock: number }>> {
  const products: ProductData[] = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, stock: true },
  });
  return new Map(products.map(p => [p.slug, { id: p.id, name: p.name, currentStock: p.stock }]));
}

// Validate all rows
async function validateAllRows(
  records: Record<string, string>[],
  productsMap: Map<string, { id: string; name: string; currentStock: number }>,
): Promise<{ previewRows: CSVPreviewRow[]; validRows: CSVPreviewRow[] }> {
  const previewRows: CSVPreviewRow[] = [];
  const validRows: CSVPreviewRow[] = [];
  const ctx: ValidationContext = { productsMap };

  for (let i = 0; i < records.length; i++) {
    const validated = await validateInventoryRow(records[i], i + 2, ctx);
    previewRows.push(validated);
    if (validated.valid) validRows.push(validated);
  }

  return { previewRows, validRows };
}

// Calculate new stock
function calculateNewStock(type: MovementType, currentStock: number, quantity: number): number {
  switch (type) {
    case 'IN':
      return currentStock + quantity;
    case 'OUT':
      return currentStock - quantity;
    case 'ADJUSTMENT':
      return quantity;
    default:
      return currentStock;
  }
}

// Calculate movement quantity
function calculateMovementQuantity(type: MovementType, newStock: number, previousStock: number): number {
  return type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : Math.abs(newStock - previousStock);
}

// Build movement data
function buildMovementData(
  productId: string,
  type: MovementType,
  previousStock: number,
  newStock: number,
  reason: string,
  reference: string | undefined,
  rowNum: number,
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
    reference: reference?.trim() || `CSV_IMPORT_${rowNum}`,
    createdBy: userId,
  };
}

// Process single row
async function processInventoryRow(
  tx: TransactionClient,
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
    const newStock = Math.max(0, calculateNewStock(type, productInfo.currentStock, quantity));

    await tx.product.update({ where: { id: productInfo.id }, data: { stock: newStock } });

    await tx.inventoryMovement.create({
      data: buildMovementData(
        productInfo.id,
        type,
        productInfo.currentStock,
        newStock,
        data.reason,
        data.reference,
        row.row,
        userId,
      ),
    });

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

// Transaction client type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Import movements
async function importMovements(validRows: CSVPreviewRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, errors: [], skipped: 0 };

  await prisma.$transaction(async (tx: TransactionClient) => {
    for (const row of validRows) {
      await processInventoryRow(tx, row, userId, result);
    }
  });

  return result;
}

// Build preview response
function buildPreviewResponse(
  previewRows: CSVPreviewRow[],
  validRows: CSVPreviewRow[],
  headers: string[],
  total: number,
) {
  return {
    success: true,
    mode: 'preview',
    totalRows: total,
    validRows: validRows.length,
    invalidRows: previewRows.filter(r => !r.valid).length,
    preview: previewRows.slice(0, 10).map(row => ({
      ...row,
      productInfo: row.productInfo
        ? { name: row.productInfo.name, currentStock: row.productInfo.currentStock }
        : undefined,
    })),
    headers,
  };
}

// Build import response
function buildImportResponse(result: ImportResult) {
  return {
    success: true,
    mode: 'import',
    result: {
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length,
      errorDetails: result.errors,
    },
  };
}
