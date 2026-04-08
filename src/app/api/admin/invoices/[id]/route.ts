/**
 * API de Factura Individual Admin
 * Obtener detalle y anular factura
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateErrorMessage } from '@/lib/i18n';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('No autorizado') },
        { status: 403 }
      );
    }

    const factura = await prisma.invoice.findUnique({
      where: { id: params.id },
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
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!factura) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Factura not found') },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado por el componente
    const facturaFormateada = {
      id: factura.id,
      numeroFactura: factura.invoiceNumber,
      emitidaEn: factura.issuedAt?.toISOString() || new Date().toISOString(),
      anulada: factura.isCancelled,
      anuladaEn: factura.cancelledAt?.toISOString() || null,
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
        numeroPedido: factura.order?.orderNumber || '',
        metodoPago: factura.order?.paymentMethod || 'CARD',
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

    return NextResponse.json({ success: true, factura: facturaFormateada });
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('No autorizado') },
        { status: 403 }
      );
    }

    // Anular la factura (no eliminar)
    const factura = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, factura });
  } catch (error) {
    console.error('Error anulando factura:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}