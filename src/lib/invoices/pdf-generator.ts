/**
 * PDF Generator Service
 * Generates PDFs from HTML using Puppeteer (dev) or HTML fallback (production)
 * Compatible with Vercel serverless environment
 */
import { getCompanyDataForInvoice, getDefaultVatRate } from '@/lib/site-config';

interface PDFOptions {
  html: string;
}

/**
 * Genera PDF usando Puppeteer en desarrollo
 * En producción (Vercel), retorna null y se usa fallback HTML
 */
export async function generatePDF({ html }: PDFOptions): Promise<Buffer | null> {
  // En producción (Vercel), Puppeteer no funciona bien
  // Retornamos null para usar el fallback HTML
  if (process.env.NODE_ENV === 'production') {
    console.log('[PDF Generator] Modo producción: usando fallback HTML');
    return null;
  }

  // Solo usar Puppeteer en desarrollo
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
    });

    await page.evaluateHandle('document.fonts.ready');

    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(
            img =>
              new Promise(resolve => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
              }),
          ),
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    return null;
  }
}

/**
 * Genera una versión HTML imprimible de la factura
 * Usado como fallback en producción cuando Puppeteer no está disponible
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
  clientEmail: string;
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
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoiceData.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .company-info h1 { 
      font-size: 24px; 
      color: #111827;
      margin-bottom: 8px;
    }
    .company-info p { 
      font-size: 14px; 
      color: #6b7280;
    }
    .invoice-info { 
      text-align: right;
    }
    .invoice-info h2 { 
      font-size: 20px; 
      color: #111827;
      margin-bottom: 8px;
    }
    .invoice-info p { 
      font-size: 14px; 
      color: #6b7280;
    }
    .client-section {
      margin-bottom: 30px;
    }
    .client-section h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    }
    .client-section p {
      font-size: 16px;
      color: #111827;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 30px 0;
    }
    th { 
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    td { 
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .text-right { text-align: right; }
    .totals {
      margin-top: 30px;
      border-top: 2px solid #e5e7eb;
      padding-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      border-top: 2px solid #111827;
      padding-top: 12px;
      margin-top: 12px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .print-button:hover {
      background: #2563eb;
    }
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

  <div class="client-section">
    <h3>Cliente</h3>
    <p><strong>${invoiceData.clientName}</strong><br/>
    ${invoiceData.clientAddress ? `${invoiceData.clientAddress}<br/>` : ''}
    ${invoiceData.clientTaxId ? `NIF: ${invoiceData.clientTaxId}<br/>` : ''}
    ${invoiceData.clientEmail}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="text-right">Cant.</th>
        <th class="text-right">Precio</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items
        .map(
          item => `
        <tr>
          <td>${item.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.price)}</td>
          <td class="text-right">${formatCurrency(item.subtotal)}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(invoiceData.subtotal)}</span>
    </div>
    <div class="totals-row">
      <span>Envío:</span>
      <span>${formatCurrency(invoiceData.shipping)}</span>
    </div>
    <div class="totals-row">
      <span>IVA (${invoiceData.vatRate}%):</span>
      <span>${formatCurrency(invoiceData.vatAmount)}</span>
    </div>
    <div class="totals-row total">
      <span>TOTAL:</span>
      <span>${formatCurrency(invoiceData.total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Gracias por su compra. Para cualquier consulta, contacte con nosotros.<br/>
    ${invoiceData.companyEmail} | ${invoiceData.companyPhone}</p>
  </div>

  <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir Factura</button>
</body>
</html>
  `;
}

/**
 * Get company configuration from database
 */
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
