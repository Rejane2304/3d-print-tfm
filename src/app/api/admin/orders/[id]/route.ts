/**
 * API de Pedido Individual Admin
 * GET: Obtener detalle de un pedido específico
 * DELETE: Eliminar un pedido y restaurar stock
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import {
  translateCountry,
  translateErrorMessage,
  translateOrderStatus,
  translatePaymentMethod,
  translatePaymentStatus,
  translateProductName,
} from '@/lib/i18n';
import { calculatePriceWithVAT } from '@/lib/constants/tax';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
      where: { id },
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

    const pedidoTransformado = {
      id: order.id,
      numeroPedido: order.orderNumber,
      estado: translateOrderStatus(order.status),
      total: calculatePriceWithVAT(Number(order.subtotal)) + Number(order.shipping),
      subtotal: calculatePriceWithVAT(Number(order.subtotal)),
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
        price: calculatePriceWithVAT(Number(item.price)),
        subtotal: calculatePriceWithVAT(Number(item.subtotal)),
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Restaurar stock para pedidos que tienen stock reservado/comprometido
    // PENDING: stock validado pero no decrementado (pero podría haberse decrementado en versiones anteriores)
    // CONFIRMED, PREPARING, SHIPPED: stock ya decrementado, debe restaurarse
    if (['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED'].includes(order.status)) {
      for (const item of order.items) {
        if (item.productId) {
          // Obtener stock actual antes de actualizar
          const currentProduct = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });

          if (currentProduct) {
            const previousStock = currentProduct.stock;
            const newStock = previousStock + item.quantity;

            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });

            // Registrar movimiento de inventario IN (devolución por eliminación)
            await prisma.inventoryMovement.create({
              data: {
                id: crypto.randomUUID(),
                productId: item.productId,
                orderId: order.id,
                createdBy: user.id,
                type: 'IN',
                quantity: item.quantity,
                previousStock,
                newStock,
                reason: `Eliminación de pedido ${order.orderNumber} - Restauración de stock`,
                reference: order.id,
              },
            });
          }
        }
      }
    }

    // Eliminar en orden: items, payment, invoice, order
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.payment.deleteMany({ where: { orderId: id } });
    await prisma.invoice.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}
