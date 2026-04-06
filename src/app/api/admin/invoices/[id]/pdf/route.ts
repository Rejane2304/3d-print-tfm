/**
 * API de Generación de PDF de Factura
 * Genera PDF de factura para descarga
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';
import { generateInvoiceHTML } from '@/lib/invoices/invoice-template';

// Type for invoice with order, items and product with images
type InvoiceWithOrder = Prisma.InvoiceGetPayload<{
  include: {
    order: {
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const factura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
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
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Mapear datos al formato del template
    const invoiceData = {
      invoiceNumber: factura.invoiceNumber,
      issuedAt: factura.issuedAt,
      isCancelled: factura.isCancelled,
      cancelledAt: factura.cancelledAt,
      companyName: factura.companyName,
      companyTaxId: factura.companyTaxId,
      companyAddress: factura.companyAddress,
      companyCity: factura.companyCity,
      companyProvince: factura.companyProvince,
      companyPostalCode: factura.companyPostalCode,
      clientName: factura.clientName,
      clientTaxId: factura.clientTaxId,
      clientAddress: factura.clientAddress,
      clientCity: factura.clientCity,
      clientProvince: factura.clientProvince,
      clientPostalCode: factura.clientPostalCode,
      clientCountry: factura.clientCountry,
      items: factura.order?.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        image: item.product?.images?.[0]?.url || undefined,
      })) || [],
      subtotal: Number(factura.subtotal),
      shipping: Number(factura.shipping),
      taxableAmount: Number(factura.taxableAmount),
      vatRate: Number(factura.vatRate),
      vatAmount: Number(factura.vatAmount),
      total: Number(factura.total),
      paymentMethod: factura.order?.paymentMethod,
      orderNumber: factura.order?.orderNumber,
    };

    // Generar HTML de la factura usando el template
    const html = generateInvoiceHTML(invoiceData);

    // Retornar como HTML con headers para descarga
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}