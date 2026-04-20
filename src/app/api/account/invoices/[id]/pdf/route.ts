/**
 * API de Descarga de Factura para Usuarios
 * Permite a los usuarios descargar sus propias facturas en PDF
 *
 * GET /api/account/invoices/[id]/pdf
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { COMPANY_CONFIG, generatePDF } from '@/lib/invoices/pdf-generator';
import { generateInvoiceHTML } from '@/lib/invoices/invoice-template';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
 * Convierte una imagen a base64
 */
async function getImageAsBase64(imageUrl: string): Promise<string | undefined> {
  try {
    // Si ya es una URL absoluta (http/https), devolverla tal cual
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Convertir ruta relativa a ruta del sistema de archivos
    // /images/products/p1/p1-1.jpg -> public/images/products/p1/p1-1.jpg
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const filePath = join(process.cwd(), 'public', cleanPath);

    // Verificar si el archivo existe
    if (!existsSync(filePath)) {
      // Imagen no encontrada, no mostrar advertencia en consola
      return undefined;
    }

    // Leer archivo y convertir a base64
    const imageBuffer = readFileSync(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
    let mimeType = 'image/jpeg';
    if (ext === 'png') {
      mimeType = 'image/png';
    } else if (ext === 'gif') {
      mimeType = 'image/gif';
    }

    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting image to base64: ${imageUrl}`, error);
    return undefined;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

    // Procesar items y convertir imágenes a base64
    const itemsWithBase64Images = await Promise.all(
      ((factura.order?.items as unknown as InvoiceItem[]) || []).map(async (item: InvoiceItem) => {
        const imageUrl = item.product?.images?.[0]?.url;
        const base64Image = imageUrl ? await getImageAsBase64(imageUrl) : undefined;

        return {
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          image: base64Image,
        };
      }) || [],
    );

    // Calcular subtotal (total de productos sin envío)
    const subtotal = itemsWithBase64Images.reduce((sum, item) => sum + item.subtotal, 0);

    // Calcular envío (diferencia entre total de orden y subtotal)
    const orderTotal = Number(factura.order?.total || 0);
    const shipping = orderTotal - subtotal;

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
      items: itemsWithBase64Images,
      subtotal: subtotal,
      shipping: Math.max(shipping, 0),
      vatRate: Number(factura.vatRate),
      vatAmount: Number(factura.vatAmount),
      total: Number(factura.total),
      paymentMethod: factura.order?.paymentMethod || undefined,
      orderNumber: factura.order?.orderNumber || undefined,
    };

    // Generar HTML de la factura usando el template
    const html = generateInvoiceHTML(invoiceData);

    // Generar PDF usando Puppeteer
    const pdfBuffer = await generatePDF({
      html,
    });

    // Retornar el PDF como descarga
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ success: false, error: 'Error al generar el PDF' }, { status: 500 });
  }
}
