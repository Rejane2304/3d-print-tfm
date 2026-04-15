/**
 * API de Importación CSV de Facturas Históricas
 * POST /api/admin/invoices/import
 *
 * Requiere: Rol ADMIN
 * Nota: Este endpoint importa facturas históricas asociadas a pedidos existentes
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateErrorMessage } from '@/lib/i18n';

// Columnas requeridas
const REQUIRED_COLUMNS = ['orderNumber', 'series', 'number', 'total'];

interface ImportRow {
  orderNumber: string;
  series: string;
  number: string;
  issueDate?: string;
  status?: string;
  total: string;
  vatRate?: string;
  vatAmount?: string;
  shipping?: string;
  subtotal?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

// Validar fila de datos
function validateRow(
  row: Record<string, string | number | boolean>,
  _rowIndex: number,
): { valid: boolean; errors: string[]; warnings: string[]; data?: ImportRow } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const orderNumber = String(row.orderNumber || '').trim();
  if (!orderNumber) errors.push('El número de pedido es obligatorio');

  const series = String(row.series || 'F').trim();
  if (!series) errors.push('La serie es obligatoria');
  if (series.length > 10) errors.push('La serie no puede tener más de 10 caracteres');

  const number = Number.parseInt(String(row.number || '0'), 10);
  if (Number.isNaN(number) || number <= 0) {
    errors.push('El número de factura debe ser un entero positivo');
  }

  const total = Number.parseFloat(String(row.total || '0'));
  if (Number.isNaN(total) || total < 0) {
    errors.push('El total debe ser un número positivo');
  }

  // Opcional: fecha de emisión
  let issueDate: string | undefined;
  if (row.issueDate) {
    const parsed = new Date(String(row.issueDate));
    if (Number.isNaN(parsed.getTime())) {
      warnings.push('Fecha de emisión inválida, se usará la fecha actual');
    } else {
      issueDate = String(row.issueDate);
    }
  }

  // Opcional: estado (por defecto ISSUED)
  const status = String(row.status || 'ISSUED')
    .toUpperCase()
    .trim();
  if (!['ISSUED', 'CANCELLED', 'DRAFT'].includes(status)) {
    warnings.push(`Estado '${status}' no reconocido, se usará 'ISSUED'`);
  }

  // Opcional: IVA
  const vatRate = Number.parseFloat(String(row.vatRate || '21'));
  if (Number.isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
    warnings.push('Tasa de IVA inválida, se usará 21%');
  }

  const vatAmount = row.vatAmount ? Number.parseFloat(String(row.vatAmount)) : undefined;
  const shipping = row.shipping ? Number.parseFloat(String(row.shipping)) : undefined;
  const subtotal = row.subtotal ? Number.parseFloat(String(row.subtotal)) : undefined;

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      orderNumber,
      series,
      number: String(number),
      issueDate,
      status,
      total: String(total),
      vatRate: String(vatRate),
      vatAmount: vatAmount !== undefined ? String(vatAmount) : undefined,
      shipping: shipping !== undefined ? String(shipping) : undefined,
      subtotal: subtotal !== undefined ? String(subtotal) : undefined,
    },
  };
}

// POST - Importar facturas históricas desde CSV
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

    // Obtener pedidos existentes
    const orders = await prisma.order.findMany({
      select: { id: true, orderNumber: true, userId: true, subtotal: true, shipping: true, total: true },
    });
    const orderMap = new Map<
      string,
      { id: string; userId: string; subtotal: number; shipping: number; total: number }
    >();
    orders.forEach(o => {
      orderMap.set(o.orderNumber.toLowerCase(), {
        id: o.id,
        userId: o.userId,
        subtotal: Number(o.subtotal),
        shipping: Number(o.shipping),
        total: Number(o.total),
      });
    });

    // Obtener facturas existentes para verificar duplicados
    const existingInvoices = await prisma.invoice.findMany({
      select: { invoiceNumber: true },
    });
    const existingNumbers = new Set(existingInvoices.map(i => i.invoiceNumber.toLowerCase()));

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
          // Verificar que el pedido existe
          const order = orderMap.get(data.orderNumber.toLowerCase());
          if (!order) {
            result.errors.push({ row: rowIndex, message: `Pedido '${data.orderNumber}' no encontrado` });
            continue;
          }

          // Generar número de factura
          const invoiceNumber = `${data.series}-${new Date().getFullYear()}-${String(data.number).padStart(6, '0')}`;

          // Verificar duplicados
          if (!options.skipDuplicates && existingNumbers.has(invoiceNumber.toLowerCase())) {
            result.errors.push({ row: rowIndex, message: `La factura '${invoiceNumber}' ya existe` });
            continue;
          }

          if (options.skipDuplicates && existingNumbers.has(invoiceNumber.toLowerCase())) {
            result.warnings.push({ row: rowIndex, message: `Factura '${invoiceNumber}' omitida (duplicado)` });
            continue;
          }

          // Calcular valores por defecto
          const subtotal = Number(data.subtotal || order.subtotal);
          const shipping = Number(data.shipping || order.shipping);
          const vatRate = Number(data.vatRate);
          const vatAmount = data.vatAmount ? Number(data.vatAmount) : (subtotal * vatRate) / 100;
          const total = Number(data.total);

          // Crear factura
          await tx.invoice.create({
            data: {
              id: crypto.randomUUID(),
              orderId: order.id,
              invoiceNumber,
              series: data.series,
              number: Number(data.number),
              // Company data (usar valores por defecto)
              companyName: '3D Print Shop',
              companyTaxId: 'B00000000',
              companyAddress: 'Calle Principal 123',
              companyCity: 'Madrid',
              companyProvince: 'Madrid',
              companyPostalCode: '28001',
              // Client data (se obtendrían del usuario del pedido)
              clientName: 'Cliente',
              clientTaxId: '',
              clientAddress: '',
              clientCity: '',
              clientProvince: '',
              clientPostalCode: '',
              clientCountry: 'Spain',
              // Totals
              subtotal,
              shipping,
              vatRate,
              vatAmount,
              total,
              issuedAt: data.issueDate ? new Date(data.issueDate) : new Date(),
              isCancelled: data.status === 'CANCELLED',
              cancelledAt: data.status === 'CANCELLED' ? new Date() : null,
            },
          });

          result.imported++;
          existingNumbers.add(invoiceNumber.toLowerCase());
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            message: `Error al crear factura: ${(error as Error).message}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} facturas importadas correctamente`
      : 'No se pudo importar ninguna factura';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando facturas:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
