/**
 * API - Detalle de Devolución
 * GET /api/returns/[id] - Cliente ve detalle de una devolución
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage, translateReturnStatus, translateProductName, translatePaymentMethod } from '@/lib/i18n';

// Helper: Autenticar usuario
async function authenticateUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: 'Usuario no encontrado', status: 404 };
  }

  return { user };
}

// GET - Obtener detalle de devolución
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateUser();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    const returnRecord = await prisma.return.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            deliveredAt: true,
            total: true,
            paymentMethod: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                slug: true,
                name: true,
                images: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: translateErrorMessage('Devolución not found') }, { status: 404 });
    }

    // Respuesta traducida
    const response = {
      devolucion: {
        id: returnRecord.id,
        numeroPedido: returnRecord.order.orderNumber,
        estado: translateReturnStatus(returnRecord.status),
        motivo: returnRecord.reason,
        cantidadTotal: Number(returnRecord.totalAmount),
        notasAdmin: returnRecord.adminNotes,
        procesadoEn: returnRecord.processedAt,
        fechaEntregaPedido: returnRecord.order.deliveredAt,
        metodoPagoOriginal: returnRecord.order.paymentMethod
          ? translatePaymentMethod(returnRecord.order.paymentMethod)
          : null,
        totalPedido: Number(returnRecord.order.total),
        createdAt: returnRecord.createdAt,
        updatedAt: returnRecord.updatedAt,
        items: returnRecord.items.map(item => ({
          id: item.id,
          producto: {
            nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
            imagen: item.product?.images?.[0]?.url || null,
          },
          cantidad: item.quantity,
          precioUnitario: Number(item.unitPrice),
          motivo: item.reason,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting return:', error);
    return NextResponse.json({ error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
