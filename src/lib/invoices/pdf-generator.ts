/**
 * PDF Generator Service - Versión Simplificada para Producción
 * Genera HTML para facturas (PDF no funciona en Vercel serverless)
 */
import { getCompanyDataForInvoice, getDefaultVatRate } from '@/lib/site-config';

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
 * Genera HTML simple para factura
 * Versión minimalista sin CSS complejo para evitar problemas SSR
 */
export function generatePrintableHTML(invoiceData: {
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
  }>;
  subtotal: number;
  shipping: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}): string {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

  const itemsHtml = invoiceData.items
    .map(
      item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoiceData.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company-info h1 { margin: 0; font-size: 24px; }
    .invoice-info { text-align: right; }
    .client-info { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
    td { padding: 10px; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
    @media print { body { margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${invoiceData.companyName}</h1>
      <p>${invoiceData.companyAddress}<br/>
      ${invoiceData.companyPostalCode} ${invoiceData.companyCity}<br/>
      NIF: ${invoiceData.companyTaxId}</p>
    </div>
    <div class="invoice-info">
      <h2>FACTURA ${invoiceData.invoiceNumber}</h2>
      <p>Fecha: ${formatDate(invoiceData.issuedAt)}</p>
      ${invoiceData.orderNumber ? `<p>Pedido: ${invoiceData.orderNumber}</p>` : ''}
    </div>
  </div>

  <div class="client-info">
    <h3>Cliente:</h3>
    <p><strong>${invoiceData.clientName}</strong><br/>
    ${invoiceData.clientAddress ? `${invoiceData.clientAddress}<br/>` : ''}
    ${invoiceData.clientTaxId ? `NIF: ${invoiceData.clientTaxId}<br/>` : ''}
    ${invoiceData.clientEmail || ''}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align: center;">Cant.</th>
        <th style="text-align: right;">Precio</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div>Subtotal: ${formatCurrency(invoiceData.subtotal)}</div>
    <div>Envío: ${formatCurrency(invoiceData.shipping)}</div>
    <div>IVA (${invoiceData.vatRate}%): ${formatCurrency(invoiceData.vatAmount)}</div>
    <div class="total-row">TOTAL: ${formatCurrency(invoiceData.total)}</div>
  </div>

  <div class="footer">
    <p>Gracias por su compra | ${invoiceData.companyEmail} | ${invoiceData.companyPhone}</p>
  </div>

  <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir</button>
</body>
</html>
  `;
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
