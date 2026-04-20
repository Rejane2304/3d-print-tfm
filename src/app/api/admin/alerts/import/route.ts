/**
 * API de Importación CSV de Alertas
 * POST /api/admin/alerts/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import type { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';
import { translateErrorMessage } from '@/lib/i18n';

// Columnas requeridas
const REQUIRED_COLUMNS = ['type', 'severity', 'title', 'message'];

// Type assertions for Prisma enums
const VALID_ALERT_TYPES: AlertType[] = [
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'ORDER_DELAYED',
  'PAYMENT_FAILED',
  'SYSTEM_ERROR',
  'NEW_ORDER',
  'NEGATIVE_REVIEW',
  'HIGH_VALUE_ORDER',
  'NEW_USER',
  'COUPON_EXPIRING',
  'ORDER_CANCELLED',
  'ORDER_STATUS_CHANGED',
  'NEW_REVIEW',
  'NEW_MESSAGE',
  'PREPARING_ORDER',
];

const VALID_SEVERITIES: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const VALID_STATUSES: AlertStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'];

interface ImportRow {
  type: string;
  severity: string;
  title: string;
  message: string;
  productId?: string;
  orderId?: string;
  userId?: string;
  couponId?: string;
  status?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: ImportRow;
}

// Validar fila de datos
function validateRow(
  row: Record<string, string | number | boolean | undefined | null>,
  _rowIndex: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let type = String(row.type || '')
    .trim()
    .toUpperCase();
  if (!type) {
    errors.push('El tipo de alerta es obligatorio');
  } else {
    // Mapeo de tipos en español a inglés
    const typeMap: Record<string, string> = {
      STOCK_BAJO: 'LOW_STOCK',
      SIN_STOCK: 'OUT_OF_STOCK',
      PEDIDO_RETRASADO: 'ORDER_DELAYED',
      PAGO_FALLIDO: 'PAYMENT_FAILED',
      ERROR_SISTEMA: 'SYSTEM_ERROR',
      NUEVO_PEDIDO: 'NEW_ORDER',
      RESEÑA_NEGATIVA: 'NEGATIVE_REVIEW',
      PEDIDO_ALTO_VALOR: 'HIGH_VALUE_ORDER',
      NUEVO_USUARIO: 'NEW_USER',
      CUPON_POR_EXPIRAR: 'COUPON_EXPIRING',
      PEDIDO_CANCELADO: 'ORDER_CANCELLED',
      CAMBIO_ESTADO_PEDIDO: 'ORDER_STATUS_CHANGED',
      NUEVA_RESEÑA: 'NEW_REVIEW',
      NUEVO_MENSAJE: 'NEW_MESSAGE',
      PREPARANDO_PEDIDO: 'PREPARING_ORDER',
    };

    if (typeMap[type]) {
      type = typeMap[type];
    }

    // Validación usando string array en lugar de AlertType[] para evitar conflicto de tipos
    const validTypesArray: readonly string[] = VALID_ALERT_TYPES;
    if (!validTypesArray.includes(type)) {
      warnings.push(`Tipo de alerta '${type}' no estándar, se usará como está`);
    }
  }

  let severity = String(row.severity || 'MEDIUM')
    .trim()
    .toUpperCase();
  if (!severity) {
    severity = 'MEDIUM';
  } else {
    // Mapeo de severidad en español
    const severityMap: Record<string, string> = {
      BAJA: 'LOW',
      MEDIA: 'MEDIUM',
      ALTA: 'HIGH',
      CRITICA: 'CRITICAL',
      CRÍTICA: 'CRITICAL',
    };
    if (severityMap[severity]) {
      severity = severityMap[severity];
    }
    // Validación usando string array en lugar de AlertSeverity[]
    const validSeveritiesArray: readonly string[] = VALID_SEVERITIES;
    if (!validSeveritiesArray.includes(severity)) {
      warnings.push(`Severidad '${severity}' no reconocida, se usará 'MEDIUM'`);
      severity = 'MEDIUM';
    }
  }

  const title = String(row.title || '').trim();
  if (!title) errors.push('El título es obligatorio');
  if (title.length > 200) errors.push('El título no puede tener más de 200 caracteres');

  const message = String(row.message || '').trim();
  if (!message) errors.push('El mensaje es obligatorio');

  // Opcional: IDs de entidades relacionadas
  const productId = String(row.productId || '').trim() || undefined;
  const orderId = String(row.orderId || '').trim() || undefined;
  const userId = String(row.userId || '').trim() || undefined;
  const couponId = String(row.couponId || '').trim() || undefined;

  // Opcional: estado
  let status = String(row.status || 'PENDING')
    .trim()
    .toUpperCase();
  const statusMap: Record<string, string> = {
    PENDIENTE: 'PENDING',
    EN_PROGRESO: 'IN_PROGRESS',
    'EN PROGRESO': 'IN_PROGRESS',
    RESUELTA: 'RESOLVED',
    IGNORADA: 'IGNORED',
  };
  if (statusMap[status]) {
    status = statusMap[status];
  }
  // Validación usando string array en lugar de AlertStatus[]
  const validStatusesArray: readonly string[] = VALID_STATUSES;
  if (!validStatusesArray.includes(status)) {
    warnings.push(`Estado '${status}' no reconocido, se usará 'PENDING'`);
    status = 'PENDING';
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      type,
      severity,
      title,
      message,
      productId,
      orderId,
      userId,
      couponId,
      status,
    },
  };
}

// POST - Importar alertas desde CSV
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
    const body = (await req.json()) as { data: Array<Record<string, string | number | boolean | undefined | null>> };
    const { data: rows } = body;

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

    // Obtener entidades existentes para validación
    const [products, orders, users, coupons] = await Promise.all([
      prisma.product.findMany({ select: { id: true } }),
      prisma.order.findMany({ select: { id: true } }),
      prisma.user.findMany({ select: { id: true } }),
      prisma.coupon.findMany({ select: { id: true } }),
    ]);

    const productIds = new Set(products.map(p => p.id));
    const orderIds = new Set(orders.map(o => o.id));
    const userIds = new Set(users.map(u => u.id));
    const couponIds = new Set(coupons.map(c => c.id));

    // Validar todas las filas
    const validRows: { data: ImportRow; rowIndex: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i], i + 2);
      if (validation.warnings.length > 0) {
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
          // Validar referencias si existen
          if (data.productId && !productIds.has(data.productId)) {
            result.errors.push({ row: rowIndex, message: `Producto '${data.productId}' no encontrado` });
            continue;
          }
          if (data.orderId && !orderIds.has(data.orderId)) {
            result.errors.push({ row: rowIndex, message: `Pedido '${data.orderId}' no encontrado` });
            continue;
          }
          if (data.userId && !userIds.has(data.userId)) {
            result.errors.push({ row: rowIndex, message: `Usuario '${data.userId}' no encontrado` });
            continue;
          }
          if (data.couponId && !couponIds.has(data.couponId)) {
            result.errors.push({ row: rowIndex, message: `Cupón '${data.couponId}' no encontrado` });
            continue;
          }

          // Crear alerta
          await tx.alert.create({
            data: {
              id: crypto.randomUUID(),
              type: data.type as AlertType,
              severity: data.severity as AlertSeverity,
              title: data.title,
              message: data.message,
              productId: data.productId,
              orderId: data.orderId,
              userId: data.userId,
              couponId: data.couponId,
              status: data.status as AlertStatus,
            },
          });

          result.imported++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            row: rowIndex,
            message: `Error al crear alerta: ${errorMessage}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} alertas importadas correctamente`
      : 'No se pudo importar ninguna alerta';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando alertas:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
