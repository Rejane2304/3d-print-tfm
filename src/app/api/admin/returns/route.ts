/**
 * Admin Returns API
 * GET /api/admin/returns - List returns for administrators
 * PATCH /api/admin/returns - Update return status (approve/reject)
 *
 * Requires: ADMIN role
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import type { Prisma } from '@prisma/client';
import { translateErrorMessage, translateReturnStatus, translateProductName } from '@/lib/i18n';
import { emitReturnStatusUpdated } from '@/lib/realtime/event-service';
import { resolveStockAlert } from '@/lib/alerts/alert-service';

// Mapping of return statuses from Spanish to English
const estadoDevolucionToEnglish: Record<string, string> = {
  Pendiente: 'PENDING',
  Aprobada: 'APPROVED',
  Rechazada: 'REJECTED',
  Completada: 'COMPLETED',
};

// Verify admin authentication
async function authenticateAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user?.role !== 'ADMIN') {
    return { error: 'No autorizado', status: 403 };
  }

  return { user };
}

// GET - List returns
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ReturnWhereInput = {};
    if (status) {
      const englishStatus = estadoDevolucionToEnglish[status];
      if (englishStatus) {
        where.status = englishStatus as Prisma.ReturnWhereInput['status'];
      }
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
              deliveredAt: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    // Translate and transform return data
    const returnsTraducidas = returns.map(ret => ({
      id: ret.id,
      orderId: ret.orderId,
      numeroPedido: ret.order.orderNumber,
      estado: translateReturnStatus(ret.status),
      motivo: ret.reason,
      cantidadTotal: Number(ret.totalAmount),
      notasAdmin: ret.adminNotes,
      procesadoEn: ret.processedAt,
      fechaEntregaPedido: ret.order.deliveredAt,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
      usuario: {
        id: ret.user.id,
        nombre: ret.user.name,
        email: ret.user.email,
      },
      items: ret.items.map(item => ({
        id: item.id,
        producto: {
          nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
        },
        cantidad: item.quantity,
        precioUnitario: Number(item.unitPrice),
        motivo: item.reason,
      })),
    }));

    return NextResponse.json({
      success: true,
      devoluciones: returnsTraducidas,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listing returns:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// PATCH - Update return status (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { id, estado, notasAdmin } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    if (!estado) {
      return NextResponse.json({ success: false, error: 'Estado requerido' }, { status: 400 });
    }

    // Convert status from Spanish to English
    const englishStatus = estadoDevolucionToEnglish[estado];
    if (!englishStatus) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
    }

    // Get return with items
    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                stock: true,
              },
            },
          },
        },
        user: {
          select: { id: true },
        },
        order: {
          select: { orderNumber: true },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ success: false, error: 'Devolución no encontrada' }, { status: 404 });
    }

    // Validar transición de estado
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: [],
    };

    if (!validTransitions[returnRecord.status].includes(englishStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede cambiar de ${translateReturnStatus(returnRecord.status)} a ${estado}`,
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async tx => {
      // Actualizar devolución
      const updatedReturn = await tx.return.update({
        where: { id },
        data: {
          status: englishStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
          adminNotes: notasAdmin || returnRecord.adminNotes,
          processedAt: ['APPROVED', 'REJECTED'].includes(englishStatus) ? new Date() : returnRecord.processedAt,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
          order: {
            select: { orderNumber: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Si se aprueba, restaurar stock
      if (englishStatus === 'APPROVED') {
        for (const item of returnRecord.items) {
          if (!item.product) continue;

          const previousStock = item.product.stock;
          const newStock = previousStock + item.quantity;

          // Actualizar stock del producto
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          // Crear movimiento de inventario
          await tx.inventoryMovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: `Devolución aprobada - Pedido ${returnRecord.order.orderNumber}`,
              reference: returnRecord.id,
              createdBy: auth.user.id,
            },
          });

          // Resolver alertas de stock si aplica
          await resolveStockAlert(item.productId, newStock);
        }

        // Actualizar estado de pago del pedido original a REFUNDED
        const payment = await tx.payment.findUnique({
          where: { orderId: returnRecord.orderId },
        });

        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'REFUNDED',
              refundedAmount: returnRecord.totalAmount,
              refundedAt: new Date(),
            },
          });
        }
      }

      return updatedReturn;
    });

    // Emitir evento en tiempo real
    await emitReturnStatusUpdated(result.id, estado, result.user.id);

    // Respuesta traducida
    const response = {
      success: true,
      devolucion: {
        id: result.id,
        numeroPedido: result.order.orderNumber,
        estado: translateReturnStatus(result.status),
        motivo: result.reason,
        cantidadTotal: Number(result.totalAmount),
        notasAdmin: result.adminNotes,
        procesadoEn: result.processedAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        usuario: {
          nombre: result.user.name,
          email: result.user.email,
        },
        items: result.items.map(item => ({
          id: item.id,
          producto: {
            nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
          },
          cantidad: item.quantity,
          precioUnitario: Number(item.unitPrice),
        })),
      },
      mensaje:
        englishStatus === 'APPROVED'
          ? 'Devolución aprobada. Stock restaurado y reembolso iniciado.'
          : englishStatus === 'REJECTED'
            ? 'Devolución rechazada.'
            : 'Estado actualizado correctamente.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
