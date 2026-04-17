/**
 * Orders Import Processor
 * Contains all logic separated from route
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { OrderStatus, PaymentMethod, Material } from '@prisma/client';

const orderItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int().min(1, 'Cantidad mínima 1'),
});

const orderImportSchema = z.object({
  userEmail: z.string().email('Email de usuario inválido'),
  items: z.string().refine(
    val => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every(item => orderItemSchema.safeParse(item).success);
      } catch {
        return false;
      }
    },
    { message: 'Items debe ser un array JSON válido con {productId, quantity}' },
  ),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('DELIVERED'),
  // S7770 corregido: usando z.coerce.number() en lugar de .transform(Number)
  shippingCost: z.coerce.number().default(0),
  paymentMethod: z.enum(['CARD', 'PAYPAL', 'BIZUM', 'TRANSFER']).default('CARD'),
  customerNotes: z.string().optional(),
});

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

interface OrderItemData {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  material: Material;
  subtotal: number;
}

interface ProcessRowResult {
  success: boolean;
  warning?: string;
  error?: string;
}

interface ProductCacheData {
  id: string;
  name: string;
  price: number;
  material: Material;
  category: { name: string };
}

// Main processor function
export async function processOrdersImport(req: NextRequest): Promise<Response> {
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
}): { data: unknown[]; options: { createMissingUsers?: boolean } } | NextResponse {
  const { data, options = {} } = body;

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
  }

  const requiredColumns = ['userEmail', 'items'];
  const firstRow = data[0] as Record<string, unknown>;
  const missing = requiredColumns.filter(col => !(col in firstRow));

  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Columnas requeridas faltantes: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  return { data, options: options as { createMissingUsers?: boolean } };
}

// Generate order number
function generateOrderNumber(): string {
  const prefix = 'IMP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

// Create missing user
async function createMissingUser(email: string) {
  const tempPassword = await hashPassword(crypto.randomUUID());
  return prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name: email.split('@')[0] || 'Usuario Importado',
      password: tempPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
    select: { id: true, name: true, email: true },
  });
}

// Find or create user - S7735 corregido (no negated condition)
async function findOrCreateUser(
  email: string,
  userCache: Map<string, { id: string; name: string; email: string }>,
  createMissingUsers?: boolean,
): Promise<{ user?: { id: string; name: string; email: string }; warning?: string; error?: string }> {
  const normalized = email.toLowerCase();
  const cachedUser = userCache.get(normalized);
  if (cachedUser) return { user: cachedUser };

  const dbUser = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, email: true },
  });
  if (dbUser) {
    userCache.set(normalized, dbUser);
    return { user: dbUser };
  }

  if (createMissingUsers) {
    const newUser = await createMissingUser(email);
    userCache.set(normalized, newUser);
    return { user: newUser, warning: `Usuario ${email} creado automáticamente` };
  }

  return { error: `Usuario ${email} no existe` };
}

// Fetch product from cache or DB
async function fetchProduct(
  productId: string,
  productCache: Map<string, ProductCacheData>,
): Promise<ProductCacheData | null> {
  let product = productCache.get(productId);
  if (product) return product;

  const dbProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { name: true } } },
  });

  if (dbProduct) {
    product = {
      id: dbProduct.id,
      name: dbProduct.name,
      price: Number(dbProduct.price),
      material: dbProduct.material,
      category: { name: dbProduct.category.name },
    };
    productCache.set(productId, product);
    return product;
  }
  return null;
}

// Process order items
async function processOrderItems(
  items: Array<{ productId: string; quantity: number }>,
  productCache: Map<string, ProductCacheData>,
  rowNumber: number,
  result: { errors: Array<{ row: number; message: string }> },
): Promise<{ items: OrderItemData[]; subtotal: number } | null> {
  const orderItems: OrderItemData[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await fetchProduct(item.productId, productCache);
    if (!product) {
      result.errors.push({ row: rowNumber, message: `Producto ${item.productId} no existe` });
      return null;
    }

    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      category: product.category.name,
      material: product.material,
      subtotal: itemSubtotal,
    });
  }

  return { items: orderItems, subtotal };
}

// Create order with items
async function createOrder(
  user: { id: string; name: string },
  orderItems: OrderItemData[],
  validatedData: z.infer<typeof orderImportSchema>,
  subtotal: number,
): Promise<void> {
  const shipping = validatedData.shippingCost;
  const total = subtotal + shipping;

  const orderItemsCreate = orderItems.map(item => ({
    id: crypto.randomUUID(),
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: item.category,
    material: item.material,
    subtotal: item.subtotal,
  }));

  await prisma.order.create({
    data: {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(),
      userId: user.id,
      status: validatedData.status,
      subtotal,
      shipping,
      total,
      paymentMethod: validatedData.paymentMethod,
      shippingName: user.name,
      shippingPhone: '',
      shippingAddress: 'Dirección importada',
      shippingPostalCode: '00000',
      shippingCity: 'Ciudad',
      shippingProvince: 'Provincia',
      shippingCountry: 'Spain',
      customerNotes: validatedData.customerNotes || 'Pedido importado desde CSV',
      internalNotes: 'Importado desde CSV',
      deliveredAt: validatedData.status === 'DELIVERED' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: { create: orderItemsCreate },
    },
  });
}

// Process single row
async function processOrderRow(
  row: Record<string, unknown>,
  rowNumber: number,
  userCache: Map<string, { id: string; name: string; email: string }>,
  productCache: Map<string, ProductCacheData>,
  options: { createMissingUsers?: boolean },
  result: ImportResult,
): Promise<ProcessRowResult> {
  const validatedData = orderImportSchema.parse({
    userEmail: String(row.userEmail ?? '').trim(),
    items: String(row.items ?? '').trim(),
    status: (String(row.status ?? '').toUpperCase() as OrderStatus) || 'DELIVERED',
    shippingCost: row.shippingCost ?? 0,
    paymentMethod: (String(row.paymentMethod ?? '').toUpperCase() as PaymentMethod) || 'CARD',
    customerNotes: String(row.customerNotes ?? '').trim(),
  });

  const userResult = await findOrCreateUser(validatedData.userEmail, userCache, options.createMissingUsers);
  if (userResult.error) return { success: false, error: userResult.error };
  if (userResult.warning) result.warnings.push({ row: rowNumber, message: userResult.warning });
  if (!userResult.user)
    return { success: false, error: `Usuario ${validatedData.userEmail} no pudo ser encontrado o creado` };

  const items = JSON.parse(validatedData.items) as Array<{ productId: string; quantity: number }>;
  const itemsResult = await processOrderItems(items, productCache, rowNumber, result);
  if (!itemsResult) return { success: false, error: 'Error procesando items del pedido' };

  await createOrder(userResult.user, itemsResult.items, validatedData, itemsResult.subtotal);
  return { success: true };
}

// Handle error
function handleRowError(error: unknown): string {
  if (error instanceof z.ZodError) return error.errors[0]?.message || 'Error de validación';
  return error instanceof Error ? error.message : 'Error desconocido';
}

// Process all rows
async function processAllRows(
  data: unknown[],
  options: { createMissingUsers?: boolean },
  result: ImportResult,
): Promise<void> {
  const userCache = new Map<string, { id: string; name: string; email: string }>();
  const productCache = new Map<string, ProductCacheData>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, unknown>;
    const rowNumber = i + 1;

    try {
      const processResult = await processOrderRow(row, rowNumber, userCache, productCache, options, result);
      if (processResult.success) result.imported++;
      else if (processResult.error) result.errors.push({ row: rowNumber, message: processResult.error });
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
      result.imported > 0 ? `${result.imported} pedidos importados exitosamente` : 'No se pudo importar ningún pedido',
  };
}
