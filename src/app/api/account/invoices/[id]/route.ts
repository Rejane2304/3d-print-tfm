/**
 * API - Detalle de Factura del Usuario Autenticado
 * GET /api/account/invoices/[id]
 * Devuelve el detalle completo de una factura específica del usuario
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateProductName } from '@/lib/i18n';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener factura específica del usuario
    const factura = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        order: {
          userId: usuario.id,
        },
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                taxId: true,
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      take: 1,
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Transformar datos al formato esperado por el frontend ( inglés )
    const facturaFormateada = {
      // Info básica
      invoiceNumber: factura.invoiceNumber || `INV-${factura.id.slice(0, 8)}`,
      issuedAt: factura.issuedAt?.toISOString() || new Date().toISOString(),
      isCancelled: factura.isCancelled || false,
      cancelledAt: factura.cancelledAt?.toISOString() || null,

      // Importes
      subtotal: Number(factura.subtotal) || 0,
      shipping: Number(factura.shipping) || 0,
      vatRate: Number(factura.vatRate) || 21,
      vatAmount: Number(factura.vatAmount) || 0,
      total: Number(factura.total) || 0,

      // Datos de la empresa
      companyName: factura.companyName || '3D Print S.L.',
      companyTaxId: factura.companyTaxId || 'B-12345678',
      companyAddress: factura.companyAddress || 'Calle Tecnología 123',
      companyCity: factura.companyCity || 'Barcelona',
      companyProvince: factura.companyProvince || 'Barcelona',
      companyPostalCode: factura.companyPostalCode || '08001',
      // Datos de la empresa (valores por defecto ya que no existen en el schema)
      companyEmail: 'info@3dprint.com',
      companyPhone: '+34 930 000 001',

      // Datos del cliente
      clientName: factura.clientName || 'Cliente',
      clientTaxId: factura.clientTaxId || 'N/A',
      clientAddress: factura.clientAddress || '',
      clientCity: factura.clientCity || '',
      clientProvince: factura.clientProvince || '',
      clientPostalCode: factura.clientPostalCode || '',
      clientCountry: factura.clientCountry || 'España',
      // Contacto del cliente (desde la orden)
      clientEmail: factura.order?.user?.email || '',
      clientPhone: factura.order?.user?.phone || '',

      // Info del pedido
      orderNumber: factura.order?.orderNumber || '',
      paymentMethod: factura.order?.paymentMethod || 'CARD',

      // Items
      items: (factura.order?.items || []).map(item => ({
        id: item.id || '',
        name: item.product?.slug ? translateProductName(item.product.slug) : item.name || 'Producto',
        quantity: item.quantity || 1,
        price: Number(item.price) || 0,
        subtotal: Number(item.subtotal) || 0,
        image: item.product?.images?.[0]?.url || undefined,
        description: item.product?.description || undefined,
      })),
    };

    return NextResponse.json({ factura: facturaFormateada });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 });
  }
}
