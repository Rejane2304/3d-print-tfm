/**
 * API - Detalle de Pedido del Usuario Autenticado
 * GET /api/account/orders/[id]
 * Devuelve el detalle completo de un pedido específico del usuario
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus, translatePaymentStatus, translatePaymentMethod, translateErrorMessage } from '@/lib/i18n';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Usuario not found' },
        { status: 404 }
      );
    }

    // Obtener pedido específico del usuario
    const pedido = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: usuario.id
      },
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
            isCancelled: true,
            issuedAt: true
          }
        },
        payment: {
          select: {
            status: true,
            method: true,
            createdAt: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            message: true,
            isFromCustomer: true,
            createdAt: true
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: translateErrorMessage('Pedido not found') },
        { status: 404 }
      );
    }

    // Transform to Spanish response format matching frontend expectations
    // Translate enums from English (DB) to Spanish (UI)
    const pedidoTransformado = {
      id: pedido.id,
      orderNumber: pedido.orderNumber,
      estado: translateOrderStatus(pedido.status),
      subtotal: Number(pedido.subtotal),
      envio: Number(pedido.shipping),
      total: Number(pedido.total),
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
      nombreEnvio: pedido.shippingName,
      telefonoEnvio: pedido.shippingPhone,
      shippingAddress: pedido.shippingAddress,
      complementoEnvio: pedido.shippingComplement,
      postalCodeEnvio: pedido.shippingPostalCode,
      ciudadEnvio: pedido.shippingCity,
      provinciaEnvio: pedido.shippingProvince,
      paisEnvio: pedido.shippingCountry,
      paymentMethod: pedido.paymentMethod ? translatePaymentMethod(pedido.paymentMethod) : null,
      numeroSeguimiento: pedido.trackingNumber,
      transportista: pedido.carrier,
      notasCliente: pedido.customerNotes,
      items: pedido.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        subtotal: Number(item.subtotal),
        producto: {
          nombre: item.product?.name || '',
          slug: item.product?.slug || '',
          images: item.product?.images || [],
        },
      })),
      factura: pedido.invoice ? {
        id: pedido.invoice.id,
        invoiceNumber: pedido.invoice.invoiceNumber,
        anulada: pedido.invoice.isCancelled,
        emitidaEn: pedido.invoice.issuedAt,
      } : undefined,
      pago: pedido.payment ? {
        estado: translatePaymentStatus(pedido.payment.status),
        metodo: translatePaymentMethod(pedido.payment.method),
        createdAt: pedido.payment.createdAt,
      } : undefined,
      messages: pedido.messages.map((msg) => ({
        id: msg.id,
        mensaje: msg.message,
        tipoRemitente: msg.isFromCustomer ? 'CLIENTE' : 'ADMIN',
        createdAt: msg.createdAt,
      })),
    };

    return NextResponse.json({ pedido: pedidoTransformado });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}
