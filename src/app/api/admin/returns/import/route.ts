/**
 * API de Importación CSV de Devoluciones
 * POST /api/admin/returns/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateErrorMessage } from '@/lib/i18n';

// Columnas requeridas
const REQUIRED_COLUMNS = ['orderId', 'userEmail', 'reason', 'items'];

// Estados válidos de devolución
const VALID_RETURN_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

interface ReturnItem {
  productId: string;
  quantity: number;
  reason?: string;
}

interface ImportRow {
  orderId: string;
  userEmail: string;
  reason: string;
  items: string;
  status?: string;
  adminNotes?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

// Validar y parsear items JSON
function parseItems(value: string): ReturnItem[] | null {
  if (!value || value.trim() === '') return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item: { productId: string; quantity: number; reason?: string }) => ({
      productId: String(item.productId),
      quantity: Number.parseInt(String(item.quantity), 10) || 1,
      reason: item.reason,
    }));
  } catch {
    return null;
  }
}

// Validar fila de datos
function validateRow(
  row: Record<string, string | number | boolean>,
  _rowIndex: number,
): { valid: boolean; errors: string[]; warnings: string[]; data?: ImportRow } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const orderId = String(row.orderId || '').trim();
  if (!orderId) errors.push('El ID del pedido es obligatorio');

  const userEmail = String(row.userEmail || '').trim();
  if (!userEmail) {
    errors.push('El email del usuario es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    errors.push('El email del usuario no es válido');
  }

  const reason = String(row.reason || '').trim();
  if (!reason) errors.push('El motivo de la devolución es obligatorio');

  const itemsValue = String(row.items || '');
  const items = parseItems(itemsValue);
  if (!items) {
    errors.push('Los items deben ser un array JSON válido con productId y quantity');
  } else if (items.length === 0) {
    errors.push('Debe incluir al menos un item');
  }

  // Opcional: estado
  let status = String(row.status || 'PENDING')
    .trim()
    .toUpperCase();
  const statusMap: Record<string, string> = {
    PENDIENTE: 'PENDING',
    APROBADA: 'APPROVED',
    RECHAZADA: 'REJECTED',
    COMPLETADA: 'COMPLETED',
  };
  if (statusMap[status]) {
    status = statusMap[status];
  }
  if (!VALID_RETURN_STATUSES.includes(status)) {
    warnings.push(`Estado '${status}' no reconocido, se usará 'PENDING'`);
    status = 'PENDING';
  }

  // Opcional: notas de admin
  const adminNotes = String(row.adminNotes || '').trim() || undefined;

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      orderId,
      userEmail,
      reason,
      items: itemsValue,
      status,
      adminNotes,
    },
  };
}

// POST - Importar devoluciones desde CSV
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

    // Obtener datos del body
    const body = await req.json();
    const { data: rows, options = {} } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
    }

    // Validar columnas requeridas
    const firstRow = rows[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
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

    // Obtener pedidos, usuarios y productos existentes
    const [orders, users, products] = await Promise.all([
      prisma.order.findMany({ select: { id: true, orderNumber: true, userId: true } }),
      prisma.user.findMany({ select: { id: true, email: true } }),
      prisma.product.findMany({ select: { id: true } }),
    ]);

    const orderMap = new Map<string, { id: string; userId: string }>();
    orders.forEach(o => {
      orderMap.set(o.id.toLowerCase(), { id: o.id, userId: o.userId });
      orderMap.set(o.orderNumber.toLowerCase(), { id: o.id, userId: o.userId });
    });

    const userMap = new Map<string, string>();
    users.forEach(u => {
      userMap.set(u.email.toLowerCase(), u.id);
    });

    const productIds = new Set(products.map(p => p.id));

    // Validar todas las filas
    const validRows: { data: ImportRow; rowIndex: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i], i + 2);
      if (validation.warnings) {
        result.warnings.push(...validation.warnings.map(w => ({ row: i + 2, message: w })));
      }
      if (!validation.valid || !validation.data) {
        result.errors.push(...validation.errors.map(e => ({ row: i + 2, message: e })));
      } else {
        validRows.push({ data: validation.data, rowIndex: i + 2 });
      }
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        errors: result.errors,
        warnings: result.warnings,
        message: 'No hay registros válidos para importar',
      });
    }

    // Importar en transacción
    await prisma.$transaction(async tx => {
      for (const { data, rowIndex } of validRows) {
        try {
          // Buscar pedido
          const order = orderMap.get(data.orderId.toLowerCase());
          if (!order) {
            result.errors.push({ row: rowIndex, message: `Pedido '${data.orderId}' no encontrado` });
            continue;
          }

          // Buscar usuario
          let userId = userMap.get(data.userEmail.toLowerCase());

          if (!userId && options.createMissingUsers) {
            // Crear usuario
            const newUser = await tx.user.create({
              data: {
                id: crypto.randomUUID(),
                email: data.userEmail,
                name: data.userEmail.split('@')[0] || 'Usuario',
                password: crypto.randomUUID(),
                role: 'CUSTOMER',
              },
            });
            userId = newUser.id;
            if (userId) {
              userMap.set(data.userEmail.toLowerCase(), userId);
            }
            result.warnings.push({ row: rowIndex, message: `Usuario '${data.userEmail}' creado automáticamente` });
          }

          if (!userId) {
            result.errors.push({ row: rowIndex, message: `Usuario '${data.userEmail}' no encontrado` });
            continue;
          }

          // Verificar que el usuario es el dueño del pedido
          if (order.userId !== userId) {
            result.errors.push({ row: rowIndex, message: 'El usuario no corresponde al pedido indicado' });
            continue;
          }

          // Parsear items
          const items = parseItems(data.items);
          if (!items) {
            result.errors.push({ row: rowIndex, message: 'Error al parsear items' });
            continue;
          }

          // Validar productos
          for (const item of items) {
            if (!productIds.has(item.productId)) {
              result.errors.push({ row: rowIndex, message: `Producto '${item.productId}' no encontrado` });
              continue;
            }
          }

          // Calcular total
          const totalAmount = items.length * 10; // Valor estimado

          // Crear devolución
          const returnRecord = await tx.return.create({
            data: {
              id: crypto.randomUUID(),
              orderId: order.id,
              userId,
              reason: data.reason,
              status: data.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
              totalAmount,
              adminNotes: data.adminNotes,
              processedAt: ['APPROVED', 'REJECTED', 'COMPLETED'].includes(data.status || 'PENDING') ? new Date() : null,
              updatedAt: new Date(),
            },
          });

          // Crear items de devolución
          await Promise.all(
            items.map(item =>
              tx.returnItem.create({
                data: {
                  id: crypto.randomUUID(),
                  returnId: returnRecord.id,
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: 0, // Se podría obtener del precio actual
                  reason: item.reason,
                },
              }),
            ),
          );

          result.imported++;
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            message: `Error al crear devolución: ${(error as Error).message}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} devoluciones importadas correctamente`
      : 'No se pudo importar ninguna devolución';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando devoluciones:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
