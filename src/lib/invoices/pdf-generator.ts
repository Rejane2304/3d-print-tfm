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
  let clientContact = '';
  if (invoiceData.clientEmail || invoiceData.clientPhone) {
    if (invoiceData.clientEmail) clientContact += `✉ ${invoiceData.clientEmail}`;
    if (invoiceData.clientEmail && invoiceData.clientPhone) clientContact += ' · ';
    if (invoiceData.clientPhone) clientContact += `📞 ${invoiceData.clientPhone}`;
    clientContact = `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ${clientContact}
      </div>
    `;
  }

  const cancelledBadge = invoiceData.isCancelled
    ? '<div style="display: inline-block; background: #ef4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; margin-top: 12px;">Factura Anulada</div>'
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a202c;
      line-height: 1.6;
      background: #f8fafc;
      padding: 40px 20px;
    }
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 32px 40px;
      position: relative;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-section { flex: 1; }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      color: #4f46e5;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .company-details {
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.7;
    }
    .invoice-meta {
      text-align: right;
      background: rgba(255,255,255,0.1);
      padding: 20px 28px;
      border-radius: 12px;
    }
    .invoice-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .invoice-number {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .invoice-date {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }
    .invoice-body {
      padding: 32px 40px;
    }
    .client-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .client-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-label::before {
      content: '';
      width: 3px;
      height: 12px;
      background: #4f46e5;
      border-radius: 2px;
    }
    .client-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .client-details {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .client-details strong {
      color: #1e293b;
      font-weight: 600;
    }
    .items-section {
      margin-bottom: 24px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
    .items-count {
      font-size: 12px;
      color: #64748b;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table thead th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
    }
    .items-table thead th:first-child {
      border-top-left-radius: 8px;
    }
    .items-table thead th:last-child {
      border-top-right-radius: 8px;
      text-align: right;
    }
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
    }
    .totals-section {
      background: #1e293b;
      border-radius: 12px;
      padding: 24px;
      color: white;
      min-width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: #94a3b8;
    }
    .totals-row.total-row {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid rgba(255,255,255,0.1);
      font-size: 20px;
      font-weight: 700;
      color: white;
    }
    .invoice-footer {
      background: #f8fafc;
      padding: 24px 40px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer-grid {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .footer-block {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .footer-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-content {
      text-align: left;
    }
    .footer-content h4 {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .footer-content p {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }
    .footer-note {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-note strong {
      color: #64748b;
    }
    @media (max-width: 768px) {
      .client-section { grid-template-columns: 1fr; }
      .header-content { flex-direction: column; gap: 24px; }
      .invoice-meta { text-align: left; width: 100%; }
      .footer-grid { flex-direction: column; }
      .totals-section { min-width: 100%; }
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="header-content">
        <div class="company-section">
          <div class="logo-container">
            <div class="logo-icon">3D</div>
            <div class="company-name">${invoiceData.companyName}</div>
          </div>
          <div class="company-details">
            <strong>NIF:</strong> ${invoiceData.companyTaxId}<br>
            ${invoiceData.companyAddress}<br>
            ${invoiceData.companyPostalCode} ${invoiceData.companyCity}, ${invoiceData.companyProvince}
            ${invoiceData.companyPhone ? `<br>📞 ${invoiceData.companyPhone}` : ''}
            ${invoiceData.companyEmail ? `<br>✉ ${invoiceData.companyEmail}` : ''}
          </div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-label">Factura</div>
          <div class="invoice-number">${invoiceData.invoiceNumber}</div>
          <div class="invoice-date">${formatDate(invoiceData.issuedAt)}</div>
          ${cancelledBadge}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Client Info -->
      <div class="client-section">
        <div class="client-card">
          <div class="section-label">Facturar a</div>
          <div class="client-name">${invoiceData.clientName}</div>
          <div class="client-details">
            <strong>NIF:</strong> ${invoiceData.clientTaxId || 'N/A'}<br>
            ${invoiceData.clientAddress || ''}<br>
            ${invoiceData.clientPostalCode || ''} ${invoiceData.clientCity || ''}, ${invoiceData.clientProvince || ''}<br>
            ${invoiceData.clientCountry || 'España'}
          </div>
          ${clientContact}
        </div>

        <div class="client-card">
          <div class="section-label">Información del pedido</div>
          <div class="client-details">
            <strong>Pedido:</strong> ${invoiceData.orderNumber && invoiceData.orderNumber.trim() !== '' ? invoiceData.orderNumber : 'N/A'}<br>
            <strong>Método de pago:</strong> ${getPaymentMethodName(invoiceData.paymentMethod)}<br>
            <strong>Fecha de emisión:</strong> ${formatDate(invoiceData.issuedAt)}
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="items-section">
        <div class="section-header">
          <h3 class="section-title">Conceptos</h3>
          <span class="items-count">${invoiceData.items.length} producto${invoiceData.items.length === 1 ? '' : 's'}</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%">Producto</th>
              <th style="width: 15%; text-align: center;">Cant.</th>
              <th style="width: 20%; text-align: right;">Precio</th>
              <th style="width: 15%; text-align: right;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals-wrapper">
        <div class="totals-section">
          <div class="totals-row">
            <span>Subtotal productos</span>
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
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-grid">
        <div class="footer-block">
          <div class="footer-icon">
            <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
          <div class="footer-content">
            <h4>Método de pago</h4>
            <p>${getPaymentMethodName(invoiceData.paymentMethod)}</p>
          </div>
        </div>
        ${
          invoiceData.orderNumber
            ? `
        <div class="footer-block">
          <div class="footer-icon">
            <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <div class="footer-content">
            <h4>Pedido</h4>
            <p>${invoiceData.orderNumber}</p>
          </div>
        </div>
        `
            : ''
        }
      </div>

      <div class="footer-note">
        <strong>${invoiceData.companyName}</strong> · ${invoiceData.companyCity}, ${invoiceData.companyProvince}<br>
        Factura generada electrónicamente · Este documento es válido sin firma según la normativa vigente<br>
        ${invoiceData.companyEmail ? `Contacto: ${invoiceData.companyEmail}` : ''}
      </div>
    </div>
  </div>

  <button class="no-print" id="printBtn" onclick="window.print(); this.disabled=true; this.style.opacity='0.5'; this.textContent='🖨️ Imprimiendo...';" style="position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    🖨️ Imprimir Factura
  </button>
  ${
    shouldAutoPrint
      ? `
  <script>
    // Auto-print when page loads - SOLO UNA VEZ
    (function() {
      let printed = false;
      window.addEventListener('load', function() {
        if (printed) return;
        printed = true;
        setTimeout(function() {
          window.print();
          // Deshabilitar botón después de auto-print
          var btn = document.getElementById('printBtn');
          if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = '🖨️ Imprimiendo...';
          }
        }, 800);
      });
    })();
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
