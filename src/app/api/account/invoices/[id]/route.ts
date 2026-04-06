/**
 * API - Detalle de Factura del Usuario Autenticado
 * GET /api/account/invoices/[id]
 * Devuelve el detalle completo de una factura específica del usuario
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

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
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener factura específica del usuario
    const factura = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        order: {
          userId: usuario.id
        }
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
                      select: { url: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado por el componente InvoiceViewer
    const facturaFormateada = {
      id: factura.id,
      invoiceNumber: factura.invoiceNumber,
      issuedAt: factura.issuedAt,
      isCancelled: factura.isCancelled,
      cancelledAt: factura.cancelledAt,
      baseImponible: Number(factura.taxableAmount),
      cuotaIva: Number(factura.vatAmount),
      tipoIva: Number(factura.vatRate),
      total: Number(factura.total),
      subtotal: Number(factura.subtotal),
      shipping: Number(factura.shipping),
      // Datos de la empresa
      empresaNombre: factura.companyName,
      empresaNif: factura.companyTaxId,
      empresaDireccion: factura.companyAddress,
      empresaCiudad: factura.companyCity,
      empresaProvincia: factura.companyProvince,
      empresaCodigoPostal: factura.companyPostalCode,
      empresaEmail: 'info@3dprint.com',
      empresaTelefono: '+34 930 000 001',
      // Datos del cliente
      clienteNombre: factura.clientName,
      clienteNif: factura.clientTaxId,
      clienteDireccion: factura.clientAddress,
      clienteCiudad: factura.clientCity,
      clienteProvincia: factura.clientProvince,
      clienteCodigoPostal: factura.clientPostalCode,
      clientePais: factura.clientCountry || 'España',
      clienteEmail: factura.order?.user?.email || undefined,
      clienteTelefono: factura.order?.user?.phone || undefined,
      // Items con imágenes
      order: {
        orderNumber: factura.order?.orderNumber || '',
        paymentMethod: factura.order?.paymentMethod || 'CARD',
        items: factura.order?.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          image: item.product?.images?.[0]?.url || undefined,
          description: item.product?.description || undefined,
        })) || [],
        usuario: {
          nombre: factura.order?.user?.name || '',
          email: factura.order?.user?.email || '',
          telefono: factura.order?.user?.phone || undefined,
        },
      },
    };

    return NextResponse.json({ factura: facturaFormateada });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    );
  }
}
