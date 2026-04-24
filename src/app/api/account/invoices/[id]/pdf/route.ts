/**
 * API de Descarga de Factura para Usuarios
 * Permite a los usuarios descargar sus propias facturas en PDF o HTML
 *
 * GET /api/account/invoices/[id]/pdf
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { COMPANY_CONFIG, generatePDF, generatePrintableHTML } from '@/lib/invoices/pdf-generator';
import { generatePDFServerless } from '@/lib/invoices/pdf-generator-serverless';

// Type for invoice item
interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    images: { url: string }[];
  } | null;
}

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
  // In production, images should be served from CDN or external storage
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

    if (!usuario) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const factura = await prisma.invoice.findUnique({
      where: { id },
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
      return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar que la factura pertenece al usuario
    if (factura.order?.userId !== usuario.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    // Procesar items - usar URLs de imágenes directamente
    const itemsWithImages = ((factura.order?.items as unknown as InvoiceItem[]) || []).map((item: InvoiceItem) => {
      const imageUrl = item.product?.images?.[0]?.url;
      return {
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        image: getImageUrl(imageUrl),
      };
    });

    // Calcular subtotal (total de productos sin envío)
    const subtotal = itemsWithImages.reduce((sum, item) => sum + item.subtotal, 0);

    // Usar el valor de envío que viene de la factura (ya calculado correctamente)
    const shipping = Number(factura.shipping || 0);

    // Mapear datos de la factura al formato del template usando datos CORRECTOS de empresa
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
      clientCountry: factura.clientCountry || undefined,
      clientEmail: usuario.email,
      clientPhone: usuario.phone || undefined,
      items: itemsWithImages,
      subtotal: subtotal,
      shipping: Math.max(shipping, 0),
      vatRate: Number(factura.vatRate),
      vatAmount: Number(factura.vatAmount),
      total: Number(factura.total),
      paymentMethod: factura.order?.paymentMethod || undefined,
      orderNumber: factura.order?.orderNumber || undefined,
    };

    // En producción, generar PDF real con pdf-lib (funciona en serverless)
    if (process.env.NODE_ENV === 'production') {
      console.log('[Invoice PDF] Generando PDF real en producción con pdf-lib');
      try {
        const pdfBuffer = await generatePDFServerless(invoiceData);

        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error('[Invoice PDF] Error generating PDF with pdf-lib:', pdfError);
        // Fallback to HTML if PDF generation fails
        const htmlContent = generatePrintableHTML(invoiceData, shouldAutoPrint);
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.html"`,
          },
        });
      }
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
      console.error('[Invoice PDF] Error generating PDF:', pdfError);
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
    console.error('[Invoice PDF] Error:', error);
    return NextResponse.json({ success: false, error: 'Error al generar la factura' }, { status: 500 });
  }
}
