/**
 * API de Generación de PDF de Factura
 * Genera PDF de factura para descarga
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { COMPANY_CONFIG, generatePDF, generatePrintableHTML } from '@/lib/invoices/pdf-generator';
import type { Prisma } from '@prisma/client';

// Type for invoice with order
export type _InvoiceWithOrder = Prisma.InvoiceGetPayload<{
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

/**
 * Get image URL - returns absolute URL or placeholder
 */
function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  // If already absolute URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If relative path, convert to absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://3d-print-tfm.vercel.app';
  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if auto-print is requested
    const { searchParams } = new URL(req.url);
    const shouldAutoPrint = searchParams.get('print') === 'true';

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (usuario?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const factura = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
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
      return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 });
    }

    // Procesar items - usar URLs de imágenes directamente
    const itemsWithImages = (factura.order?.items || []).map(item => {
      const imageUrl = item.product?.images?.[0]?.url;
      return {
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        image: getImageUrl(imageUrl),
      };
    });

    // Mapear datos al formato del template usando los datos CORRECTOS de la empresa
    const invoiceData = {
      invoiceNumber: factura.invoiceNumber,
      issuedAt: factura.issuedAt,
      isCancelled: factura.isCancelled,
      cancelledAt: factura.cancelledAt,
      // Datos de la empresa - USAR CONFIGURACIÓN CORRECTA
      companyName: COMPANY_CONFIG.name,
      companyTaxId: COMPANY_CONFIG.taxId,
      companyAddress: COMPANY_CONFIG.address,
      companyCity: COMPANY_CONFIG.city,
      companyProvince: COMPANY_CONFIG.province,
      companyPostalCode: COMPANY_CONFIG.postalCode,
      companyEmail: COMPANY_CONFIG.email,
      companyPhone: COMPANY_CONFIG.phone,
      // Datos del cliente
      clientName: factura.clientName,
      clientTaxId: factura.clientTaxId,
      clientAddress: factura.clientAddress,
      clientCity: factura.clientCity,
      clientProvince: factura.clientProvince,
      clientPostalCode: factura.clientPostalCode,
      clientCountry: factura.clientCountry,
      clientEmail: factura.order?.user?.email || undefined,
      clientPhone: factura.order?.user?.phone || undefined,
      // Items y totales
      items: itemsWithImages,
      subtotal: Number(factura.subtotal),
      shipping: Number(factura.shipping),
      vatRate: Number(factura.vatRate),
      vatAmount: Number(factura.vatAmount),
      total: Number(factura.total),
      paymentMethod: factura.order?.paymentMethod,
      orderNumber: factura.order?.orderNumber,
    };

    // En producción, usar HTML con descarga (PDF no funciona en Vercel)
    if (process.env.NODE_ENV === 'production') {
      console.log('[Admin Invoice PDF] Generando HTML descargable en producción');
      const htmlContent = generatePrintableHTML(invoiceData, shouldAutoPrint);

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.html"`,
        },
      });
    }

    // En desarrollo, intentar generar PDF
    try {
      const html = generatePrintableHTML(invoiceData);
      const pdfBuffer = await generatePDF({ html });

      if (pdfBuffer) {
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.pdf"`,
          },
        });
      }
    } catch (pdfError) {
      console.error('[Admin Invoice PDF] Error generating PDF:', pdfError);
    }

    // Fallback a HTML si PDF falla
    const htmlContent = generatePrintableHTML(invoiceData);
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="factura-${factura.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('[Admin Invoice PDF] Error:', error);
    return NextResponse.json({ success: false, error: 'Error al generar el PDF' }, { status: 500 });
  }
}
