/**
 * PDF Generator Service - Versión Unificada
 * Genera HTML para facturas con el mismo diseño que InvoiceViewer
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
 * Genera HTML profesional para factura
 * Usa el MISMO diseño que InvoiceViewer para consistencia visual
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
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

  const getPaymentMethodName = (method?: string) => {
    const methods: Record<string, string> = {
      CARD: 'Tarjeta de crédito/débito',
      PAYPAL: 'PayPal',
      BIZUM: 'Bizum',
      TRANSFER: 'Transferencia bancaria',
      TARJETA: 'Tarjeta de crédito/débito',
    };
    return methods[method || ''] || 'Tarjeta de crédito/débito';
  };

  // Generar HTML de items
  const itemsHTML = invoiceData.items
    .map(
      item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; flex-shrink: 0;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                : `<svg width="24" height="24" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`
            }
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-weight: 600; color: #1e293b; font-size: 13px;">${item.name}</span>
            ${item.description ? `<span style="font-size: 11px; color: #64748b;">${item.description}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; background: #f1f5f9; border-radius: 6px; font-weight: 600; color: #475569; font-size: 12px;">${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 13px;">${formatCurrency(item.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b; font-size: 13px;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `,
    )
    .join('');

  // Construir contacto del cliente
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _clientContact = '';

  const cancelledBadge = invoiceData.isCancelled
    ? '<div style="display: inline-block; background: #ef4444; color: white; padding: 8px 16px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 12px; border: 2px solid #ef4444;">FACTURA ANULADA</div>'
    : '';

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
      font-family: Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      background: #f8fafc;
      padding: 40px;
    }
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      border: 1px solid #e2e8f0;
    }
    .invoice-header {
      background: #4f46e5;
      color: white;
      padding: 30px 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-section { flex: 1; }
    .company-name {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .company-details {
      font-size: 10px;
      opacity: 0.9;
      line-height: 1.6;
    }
    .invoice-meta {
      text-align: right;
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .invoice-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .invoice-number {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .invoice-date {
      font-size: 11px;
      opacity: 0.9;
      margin-top: 4px;
    }
    .invoice-body {
      padding: 30px 40px;
    }
    .client-section {
      margin-bottom: 30px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4f46e5;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-label::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #4f46e5;
      border-radius: 2px;
    }
    .client-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .client-details {
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .items-section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table thead th {
      background: #4f46e5;
      padding: 12px;
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: white;
      border: none;
    }
    .items-table thead th:last-child {
      text-align: right;
    }
    .items-table tbody td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .items-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .totals-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      width: 50%;
      margin-left: auto;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
      color: #64748b;
    }
    .totals-row.total-row {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #4f46e5;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .invoice-footer {
      background: #f8fafc;
      padding: 20px 40px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer-note {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.6;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; border: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-section">
        <div class="company-name">${invoiceData.companyName}</div>
        <div class="company-details">
          NIF: ${invoiceData.companyTaxId}<br>
          ${invoiceData.companyAddress}<br>
          ${invoiceData.companyPostalCode} ${invoiceData.companyCity}, ${invoiceData.companyProvince}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-label">Factura</div>
        <div class="invoice-number">${invoiceData.invoiceNumber}</div>
        <div class="invoice-date">${formatDate(invoiceData.issuedAt)}</div>
        ${cancelledBadge}
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Client Info -->
      <div class="client-section">
        <div class="section-label">Datos del Cliente</div>
        <div class="client-name">${invoiceData.clientName}</div>
        <div class="client-details">
          ${invoiceData.clientTaxId ? `NIF: ${invoiceData.clientTaxId}<br>` : ''}
          ${invoiceData.clientAddress ? `${invoiceData.clientAddress}<br>` : ''}
          ${invoiceData.clientPostalCode || ''} ${invoiceData.clientCity || ''}, ${invoiceData.clientProvince || ''}
          ${invoiceData.clientCountry ? `<br>${invoiceData.clientCountry}` : ''}
          ${invoiceData.clientEmail ? `<br>${invoiceData.clientEmail}` : ''}
          ${invoiceData.clientPhone ? `<br>${invoiceData.clientPhone}` : ''}
        </div>
      </div>

      <!-- Items -->
      <div class="items-section">
        <div class="section-title">Conceptos</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cant.</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(invoiceData.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Envío</span>
          <span>${formatCurrency(invoiceData.shipping)}</span>
        </div>
        <div class="totals-row">
          <span>IVA (${invoiceData.vatRate}%)</span>
          <span>${formatCurrency(invoiceData.vatAmount)}</span>
        </div>
        <div class="totals-row total-row">
          <span>TOTAL</span>
          <span>${formatCurrency(invoiceData.total)}</span>
        </div>
      </div>

      <!-- Payment Info -->
      <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 4px;">
        <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">Método de Pago</div>
        <div style="font-size: 11px; color: #1e293b; font-weight: 600;">${getPaymentMethodName(invoiceData.paymentMethod)}</div>
        ${
          invoiceData.orderNumber
            ? `
        <div style="margin-top: 10px;">
          <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">Pedido</div>
          <div style="font-size: 11px; color: #1e293b; font-weight: 600;">${invoiceData.orderNumber}</div>
        </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-note">
        <strong>${invoiceData.companyName}</strong> · ${invoiceData.companyCity}, ${invoiceData.companyProvince}<br>
        Factura generada electrónicamente · Este documento es válido sin firma según la normativa vigente
      </div>
    </div>
  </div>

  <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer;">
    🖨️ Imprimir
  </button>
  ${
    shouldAutoPrint
      ? `
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 500); };
  </script>
  `
      : ''
  }
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
