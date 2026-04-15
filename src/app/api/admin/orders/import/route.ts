/**
 * API Route - Import Orders from CSV (Admin)
 * POST /api/admin/orders/import
 * Imports historical orders from CSV file
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { OrderStatus, PaymentMethod, Material } from '@prisma/client';

// Schema for order item
const orderItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int().min(1, 'Cantidad mínima 1'),
});

// Validation schema for order import
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
  shippingCost: z
    .string()
    .or(z.number())
    .transform(val => Number(val))
    .default(0),
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

// Generate order number
function generateOrderNumber(): string {
  const prefix = 'IMP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Hash password helper
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
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
    const requiredColumns = ['userEmail', 'items'];
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

    // Cache for user lookups
    const userCache = new Map<string, { id: string; name: string; email: string }>();
    // Cache for product lookups
    const productCache = new Map<
      string,
      { id: string; name: string; price: number; material: Material; category: { name: string } }
    >();

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validate row data
        const validatedData = orderImportSchema.parse({
          userEmail: row.userEmail?.trim(),
          items: row.items?.trim(),
          status: (row.status?.toUpperCase() as OrderStatus) || 'DELIVERED',
          shippingCost: row.shippingCost || 0,
          paymentMethod: (row.paymentMethod?.toUpperCase() as PaymentMethod) || 'CARD',
          customerNotes: row.customerNotes?.trim(),
        });

        // Find or cache user
        let user = userCache.get(validatedData.userEmail.toLowerCase());
        if (!user) {
          const dbUser = await prisma.user.findUnique({
            where: { email: validatedData.userEmail.toLowerCase() },
            select: { id: true, name: true, email: true },
          });

          if (!dbUser) {
            if (options.createMissingUsers) {
              // Create user with temporary data
              const tempPassword = await hashPassword(crypto.randomUUID());
              const newUser = await prisma.user.create({
                data: {
                  id: crypto.randomUUID(),
                  email: validatedData.userEmail.toLowerCase(),
                  name: validatedData.userEmail.split('@')[0] || 'Usuario Importado',
                  password: tempPassword,
                  role: 'CUSTOMER',
                  isActive: true,
                },
                select: { id: true, name: true, email: true },
              });
              user = newUser;
              if (user) {
                userCache.set(validatedData.userEmail.toLowerCase(), user);
              }
              result.warnings.push({
                row: rowNumber,
                message: `Usuario ${validatedData.userEmail} creado automáticamente`,
              });
            } else {
              result.errors.push({
                row: rowNumber,
                message: `Usuario ${validatedData.userEmail} no existe`,
              });
              continue;
            }
          } else {
            user = dbUser;
            userCache.set(validatedData.userEmail.toLowerCase(), user);
          }
        }

        // Check user exists
        if (!user) {
          result.errors.push({
            row: rowNumber,
            message: `Usuario ${validatedData.userEmail} no pudo ser encontrado o creado`,
          });
          continue;
        }

        // Parse items
        const items = JSON.parse(validatedData.items) as Array<{ productId: string; quantity: number }>;

        // Validate and fetch products
        const orderItems: OrderItemData[] = [];
        let subtotal = 0;

        for (const item of items) {
          let product = productCache.get(item.productId);

          if (!product) {
            const dbProduct = await prisma.product.findUnique({
              where: { id: item.productId },
              include: { category: { select: { name: true } } },
            });

            if (!dbProduct) {
              result.errors.push({
                row: rowNumber,
                message: `Producto ${item.productId} no existe`,
              });
              throw new Error('Producto no existe');
            }

            product = {
              id: dbProduct.id,
              name: dbProduct.name,
              price: Number(dbProduct.price),
              material: dbProduct.material,
              category: { name: dbProduct.category.name },
            };
            productCache.set(item.productId, product);
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

        // Calculate totals
        const shipping = validatedData.shippingCost;
        const total = subtotal + shipping;

        // Create order items data for Prisma
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

        // Create order with order items
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
            items: {
              create: orderItemsCreate,
            },
          },
        });

        result.imported++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push({
            row: rowNumber,
            message: error.errors[0]?.message || 'Error de validación',
          });
        } else if (error instanceof Error && error.message === 'Producto no existe') {
          // Already handled above
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
        result.imported > 0
          ? `${result.imported} pedidos importados exitosamente`
          : 'No se pudo importar ningún pedido',
    });
  } catch (error) {
    console.error('Error importing orders:', error);
    return NextResponse.json({ success: false, error: 'Error al importar pedidos' }, { status: 500 });
  }
}
