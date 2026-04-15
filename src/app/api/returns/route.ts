/**
 * API - Returns (Devoluciones)
 * POST /api/returns - Cliente crea una devolución
 * GET /api/returns - Cliente ve sus devoluciones
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage, translateReturnStatus, translateProductName } from '@/lib/i18n';
import { createReturnAlert } from '@/lib/alerts/alert-service';
import { Prisma } from '@prisma/client';

const RETURN_WINDOW_DAYS = 30;

// Helper: Autenticar usuario
async function authenticateUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return { error: 'Usuario no encontrado', status: 404 };
  }

  return { user };
}

// Helper: Verificar si el pedido puede ser devuelto
interface OrderWithItems {
  id: string;
  status: string;
  deliveredAt: Date | null;
  items: Array<{
    id: string;
    price: Prisma.Decimal;
    quantity: number;
    productId: string | null;
    product?: {
      id: string;
      slug: string;
      name: string;
      stock: number;
    } | null;
  }>;
  returns: Array<{
    status: string;
  }>;
}

async function canBeReturned(
  orderId: string,
  userId: string,
): Promise<{ valid: boolean; error?: string; order?: OrderWithItems }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, slug: true, name: true, stock: true },
          },
        },
      },
      returns: true,
    },
  });

  if (!order) {
    return { valid: false, error: 'Pedido no encontrado' };
  }

  // Solo pedidos entregados pueden devolverse
  if (order.status !== 'DELIVERED') {
    return { valid: false, error: `No se puede devolver un pedido en estado ${order.status}` };
  }

  // Verificar ventana de devolución (30 días)
  if (!order.deliveredAt) {
    return { valid: false, error: 'El pedido no tiene fecha de entrega registrada' };
  }

  const deliveredAt = new Date(order.deliveredAt);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return { valid: false, error: `El período de devolución de ${RETURN_WINDOW_DAYS} días ha expirado` };
  }

  // Verificar si ya hay devoluciones en proceso
  const pendingReturn = order.returns.find(r => r.status === 'PENDING');
  if (pendingReturn) {
    return { valid: false, error: 'Ya existe una devolución en proceso para este pedido' };
  }

  return { valid: true, order };
}

// POST - Crear devolución
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await req.json();
    const { orderId, reason, items } = body;

    // Validaciones
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json({ error: 'El motivo debe tener al menos 10 caracteres' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un producto para devolver' }, { status: 400 });
    }

    // Verificar si el pedido puede ser devuelto
    const returnCheck = await canBeReturned(orderId, user.id);
    if (!returnCheck.valid) {
      return NextResponse.json({ error: returnCheck.error }, { status: 400 });
    }

    const order = returnCheck.order;

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Validar items
    const returnItems: Array<{
      orderItemId: string;
      quantity: number;
      reason?: string;
    }> = [];

    let totalAmount = new Prisma.Decimal(0);

    for (const item of items) {
      const orderItem = order.items.find((i: { id: string }) => i.id === item.orderItemId);
      if (!orderItem) {
        return NextResponse.json({ error: `Item ${item.orderItemId} no encontrado en el pedido` }, { status: 400 });
      }

      if (!item.quantity || item.quantity <= 0 || item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { error: `Cantidad inválida para ${orderItem.product?.name || 'producto'}` },
          { status: 400 },
        );
      }

      returnItems.push({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason,
      });

      totalAmount = totalAmount.add(new Prisma.Decimal(orderItem.price).mul(item.quantity));
    }

    // Crear devolución en transacción
    const result = await prisma.$transaction(async tx => {
      // Crear la devolución
      const returnRecord = await tx.return.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          userId: user.id,
          reason: reason.trim(),
          status: 'PENDING',
          totalAmount,
          items: {
            create: returnItems.map(item => {
              const foundItem = order.items.find((i: { id: string }) => i.id === item.orderItemId);
              if (!foundItem) {
                throw new Error(`Item ${item.orderItemId} no encontrado`);
              }
              return {
                id: crypto.randomUUID(),
                productId: foundItem.productId!,
                quantity: item.quantity,
                unitPrice: foundItem.price,
                reason: item.reason,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { slug: true, name: true },
              },
            },
          },
          order: {
            select: { orderNumber: true },
          },
        },
      });

      return returnRecord;
    });

    // Crear alerta para el admin
    try {
      await createReturnAlert(result.id, result.order.orderNumber, user.name || user.email);
    } catch (alertError) {
      console.error('Error creating return alert:', alertError);
    }

    // Respuesta traducida
    const response = {
      devolucion: {
        id: result.id,
        numeroPedido: result.order.orderNumber,
        estado: translateReturnStatus(result.status),
        motivo: result.reason,
        cantidadTotal: Number(result.totalAmount),
        createdAt: result.createdAt,
        items: result.items.map(item => ({
          id: item.id,
          producto: {
            nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
          },
          cantidad: item.quantity,
          precioUnitario: Number(item.unitPrice),
        })),
      },
      mensaje: 'Devolución solicitada correctamente',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// GET - Listar devoluciones del usuario
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: { userId: string; status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' } = { userId: user.id };

    if (status) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;
      if (validStatuses.includes(status as (typeof validStatuses)[number])) {
        where.status = status as (typeof validStatuses)[number];
      }
    }

    const returns = await prisma.return.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true, deliveredAt: true },
        },
        items: {
          include: {
            product: {
              select: { slug: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Respuesta traducida
    const response = {
      devoluciones: returns.map(ret => ({
        id: ret.id,
        numeroPedido: ret.order.orderNumber,
        estado: translateReturnStatus(ret.status),
        motivo: ret.reason,
        cantidadTotal: Number(ret.totalAmount),
        notasAdmin: ret.adminNotes,
        fechaEntregaPedido: ret.order.deliveredAt,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
        items: ret.items.map(item => ({
          id: item.id,
          producto: {
            nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
          },
          cantidad: item.quantity,
          precioUnitario: Number(item.unitPrice),
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing returns:', error);
    return NextResponse.json({ error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
