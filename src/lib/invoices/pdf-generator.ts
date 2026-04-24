/**
 * PDF Generator Service - Versión Unificada
 * Genera HTML para facturas con el mismo diseño que InvoiceViewer
 */
import { getCompanyDataForInvoice, getDefaultVatRate } from '@/lib/site-config';
import { generateInvoiceHTML } from './invoice-template';

interface PDFOptions {
  html: string;
}

/**
 * En producción siempre retorna null (PDF no soportado)
 * En desarrollo intenta usar Puppeteer
 */
export async function generatePDF({ html }: PDFOptions): Promise<Buffer | null> {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    return null;
  }
}

/**
 * Genera HTML profesional para factura
 * Usa el MISMO diseño que InvoiceViewer para consistencia visual
 *
 * AHORA: Delega en generateInvoiceHTML de invoice-template.ts para
 * garantizar consistencia absoluta entre producción y desarrollo.
 */
export function generatePrintableHTML(
  invoiceData: {
    invoiceNumber: string;
    issuedAt: Date;
    isCancelled?: boolean;
    cancelledAt?: Date | null;
    companyName: string;
    companyTaxId: string;
    companyAddress: string;
    companyCity: string;
    companyProvince: string;
    companyPostalCode: string;
    companyEmail: string;
    companyPhone: string;
    clientName: string;
    clientTaxId?: string | null;
    clientAddress?: string | null;
    clientCity?: string | null;
    clientProvince?: string | null;
    clientPostalCode?: string | null;
    clientCountry?: string;
    clientEmail?: string;
    clientPhone?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      image?: string;
      description?: string;
    }>;
    subtotal: number;
    shipping: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    paymentMethod?: string;
    orderNumber?: string;
  },
  shouldAutoPrint = false,
): string {
  // Convertir los datos al formato esperado por generateInvoiceHTML
  const data = {
    ...invoiceData,
    clientTaxId: invoiceData.clientTaxId || '',
    clientAddress: invoiceData.clientAddress || '',
    clientCity: invoiceData.clientCity || '',
    clientProvince: invoiceData.clientProvince || '',
    clientPostalCode: invoiceData.clientPostalCode || '',
    issuedAt: invoiceData.issuedAt,
    cancelledAt: invoiceData.cancelledAt,
  };

  // Generar HTML usando el template unificado
  const html = generateInvoiceHTML(data);

  // Si se requiere auto-print, inyectar el script
  if (shouldAutoPrint) {
    return html.replace(
      '</body>',
      `  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 500); };
  </script>
</body>`,
    );
  }

  return html;
}

export async function getCompanyConfig(): Promise<{
  name: string;
  taxId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  vatRate: number;
}> {
  const companyData = await getCompanyDataForInvoice();
  const vatRate = await getDefaultVatRate();

  return {
    name: companyData?.companyName || '3D Print',
    taxId: companyData?.companyTaxId || 'B12345678',
    address: companyData?.companyAddress || 'Calle Admin 123',
    city: companyData?.companyCity || 'Barcelona',
    province: companyData?.companyProvince || 'Barcelona',
    postalCode: companyData?.companyPostalCode || '08001',
    phone: '+34 930 000 001',
    email: 'info@3dprint.com',
    vatRate,
  };
}

export const COMPANY_CONFIG = {
  name: '3D Print',
  taxId: 'B12345678',
  address: 'Calle Admin 123',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
  phone: '+34 930 000 001',
  email: 'info@3dprint.com',
  vatRate: 21,
} as const;
