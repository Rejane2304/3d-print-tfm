/**
 * API - Detalle de Pedido del Usuario Autenticado
 * GET /api/account/orders/[id]
 * Devuelve el detalle completo de un pedido específico del usuario
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import {
  translateErrorMessage,
  translateOrderStatus,
  translatePaymentMethod,
  translatePaymentStatus,
  translateProductName,
} from '@/lib/i18n';
import { Invoice, Order, OrderItem, OrderMessage, Payment } from '@prisma/client';

interface OrderWithRelations extends Order {
  items: (OrderItem & {
    product: {
      name: string;
      slug: string;
      images: { url: string }[];
    } | null;
  })[];
  invoice: Invoice | null;
  payment: Payment | null;
  messages: OrderMessage[];
}

interface CouponInfo {
  code: string;
  type: string;
}

async function authenticateUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const usuario = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!usuario) {
    return { error: 'Usuario not found', status: 404 };
  }

  return { usuario };
}

async function getCouponInfo(couponId: string | null | undefined): Promise<CouponInfo | null> {
  if (!couponId) {
    return null;
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { code: true, type: true },
  });

  if (!coupon) {
    return null;
  }

  let couponType = '';
  if (coupon.type === 'PERCENTAGE') {
    couponType = 'Porcentaje';
  } else if (coupon.type === 'FIXED') {
    couponType = 'Monto Fijo';
  } else {
    couponType = 'Envío Gratis';
  }

  return {
    code: coupon.code,
    type: couponType,
  };
}

function transformOrder(pedido: OrderWithRelations, couponInfo: CouponInfo | null) {
  return {
    id: pedido.id,
    numeroPedido: pedido.orderNumber,
    estado: translateOrderStatus(pedido.status),
    subtotal: Number(pedido.subtotal),
    envio: Number(pedido.shipping),
    descuento: pedido.discount ? Number(pedido.discount) : null,
    cupon: couponInfo,
    total: Number(pedido.total),
    createdAt: pedido.createdAt,
    updatedAt: pedido.updatedAt,
    nombreEnvio: pedido.shippingName,
    telefonoEnvio: pedido.shippingPhone,
    direccionEnvio: pedido.shippingAddress,
    complementoEnvio: pedido.shippingComplement,
    postalCodeEnvio: pedido.shippingPostalCode,
    ciudadEnvio: pedido.shippingCity,
    provinciaEnvio: pedido.shippingProvince,
    paisEnvio: pedido.shippingCountry,
    metodoPago: pedido.paymentMethod
      ? translatePaymentMethod(pedido.paymentMethod)
      : null,
    numeroSeguimiento: pedido.trackingNumber,
    transportista: pedido.carrier,
    notasCliente: pedido.customerNotes,
    items: pedido.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      subtotal: Number(item.subtotal),
      producto: {
        nombre: item.product?.slug
          ? translateProductName(item.product.slug)
          : '',
        slug: item.product?.slug || '',
        images: item.product?.images || [],
      },
    })),
    factura: pedido.invoice
      ? {
        id: pedido.invoice.id,
        numeroFactura: pedido.invoice.invoiceNumber,
        anulada: pedido.invoice.isCancelled,
        emitidaEn: pedido.invoice.issuedAt,
      }
      : undefined,
    pago: pedido.payment
      ? {
        estado: translatePaymentStatus(pedido.payment.status),
        metodo: translatePaymentMethod(pedido.payment.method),
        createdAt: pedido.payment.createdAt,
      }
      : undefined,
    messages: pedido.messages.map((msg) => ({
      id: msg.id,
      mensaje: msg.message,
      tipoRemitente: msg.isFromCustomer ? 'CLIENTE' : 'ADMIN',
      createdAt: msg.createdAt,
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authenticateUser();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { usuario } = auth;

    const pedido = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: usuario.id,
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
                  select: { url: true },
                },
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            isCancelled: true,
            issuedAt: true,
          },
        },
        payment: {
          select: {
            status: true,
            method: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            message: true,
            isFromCustomer: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: translateErrorMessage('Pedido not found') },
        { status: 404 },
      );
    }

    const couponInfo = await getCouponInfo(pedido.couponId);
    const pedidoTransformado = transformOrder(pedido as OrderWithRelations, couponInfo);

    return NextResponse.json({ pedido: pedidoTransformado });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 },
    );
  }
}
