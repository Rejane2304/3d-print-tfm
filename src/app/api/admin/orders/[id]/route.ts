/**
 * API de Pedido Individual Admin
 * Obtener detalle de un pedido específico
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import {
  translateCountry,
  translateErrorMessage,
  translateOrderStatus,
  translatePaymentMethod,
  translatePaymentStatus,
  translateProductName,
} from '@/lib/i18n';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        payment: true,
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Pedido not found') }, { status: 404 });
    }

    // Transform to Spanish response format matching frontend expectations
    // Translate enums from English (DB) to Spanish (UI)
    const pedidoTransformado = {
      id: order.id,
      numeroPedido: order.orderNumber,
      estado: translateOrderStatus(order.status),
      total: order.total,
      subtotal: Number(order.subtotal),
      envio: Number(order.shipping),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      usuario: {
        nombre: order.user.name,
        email: order.user.email,
      },
      items: order.items.map(item => ({
        id: item.id,
        nombre: item.product?.slug ? translateProductName(item.product.slug) : item.product?.name || 'Producto',
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        imagenUrl: item.product?.images?.[0]?.url || null,
      })),
      nombreEnvio: order.shippingName,
      telefonoEnvio: order.shippingPhone,
      direccionEnvio: order.shippingAddress,
      complementoEnvio: order.shippingComplement,
      postalCodeEnvio: order.shippingPostalCode,
      ciudadEnvio: order.shippingCity,
      provinciaEnvio: order.shippingProvince,
      paisEnvio: translateCountry(order.shippingCountry),
      metodoPago: order.paymentMethod ? translatePaymentMethod(order.paymentMethod) : null,
      numeroSeguimiento: order.trackingNumber,
      transportista: order.carrier,
      notasInternas: order.internalNotes,
      pago: order.payment
        ? {
            estado: translatePaymentStatus(order.payment.status),
            metodo: translatePaymentMethod(order.payment.method),
            createdAt: order.payment.createdAt,
          }
        : undefined,
    };

    return NextResponse.json({ success: true, pedido: pedidoTransformado });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
