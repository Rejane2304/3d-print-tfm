/**
 * API - Listado de Pedidos del Usuario Autenticado
 * GET /api/account/orders
 * Devuelve todos los pedidos del usuario logueado con nombres en español
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus, translatePaymentStatus, translatePaymentMethod, translateProductName } from '@/lib/i18n';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener pedidos del usuario
    const pedidosRaw = await prisma.order.findMany({
      where: { userId: usuario.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            isCancelled: true
          }
        },
        payment: {
          select: {
            status: true,
            method: true
          }
        }
      }
    });

    // Transformar a formato español esperado por el frontend
    // Traducir enums de inglés (BD) a español (UI)
    const pedidos = pedidosRaw.map(pedido => ({
      id: pedido.id,
      orderNumber: pedido.orderNumber,
      estado: translateOrderStatus(pedido.status),
      total: pedido.total,
      createdAt: pedido.createdAt,
      items: pedido.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        producto: {
          nombre: item.product?.slug ? translateProductName(item.product.slug) : 'Producto',
          slug: item.product?.slug || '',
          images: item.product?.images || []
        }
      })),
      factura: pedido.invoice ? {
        id: pedido.invoice.id,
        invoiceNumber: pedido.invoice.invoiceNumber,
        anulada: pedido.invoice.isCancelled
      } : undefined,
      pago: pedido.payment ? {
        estado: translatePaymentStatus(pedido.payment.status),
        metodo: translatePaymentMethod(pedido.payment.method)
      } : undefined
    }));

    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    );
  }
}
