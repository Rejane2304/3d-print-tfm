/**
 * Invoice Template Component
 * Generates HTML identical to InvoiceViewer for perfect consistency
 */

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
  description?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date | string;
  isCancelled?: boolean;
  cancelledAt?: Date | string | null;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  companyPhone?: string;
  companyEmail?: string;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry?: string;
  clientEmail?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}

// Helper function to generate client contact HTML
function getClientContactHTML(data: { clientEmail?: string; clientPhone?: string }): string {
  if (!data.clientEmail && !data.clientPhone) {
    return '';
  }

  const emailPart = data.clientEmail ? `✉ ${data.clientEmail}` : '';
  const separator = data.clientEmail && data.clientPhone ? ' · ' : '';
  const phonePart = data.clientPhone ? `📞 ${data.clientPhone}` : '';

  return `
              <div class="client-contact">
                ${emailPart}${separator}${phonePart}
              </div>
              `;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const fechaEmision = new Date(data.issuedAt).toLocaleDateString('es-ES', {
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

  const itemsHTML = data.items
    .map(
      item => `
    <tr>
      <td>
        <div class="product-cell">
          ${
            item.image
              ? `
            <div class="product-image-container">
              <img src="${item.image}" alt="${item.name}">
            </div>
          `
              : `
            <div class="product-image-placeholder">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          `
          }
          <div class="product-info">
            <span class="product-name">${item.name}</span>
            ${item.description ? `<span class="product-description">${item.description}</span>` : ''}
          </div>
        </div>
      </td>
      <td class="text-center">
        <span class="quantity-badge">${item.quantity}</span>
      </td>
      <td class="text-right unit-price">${formatCurrency(item.price)}</td>
      <td class="text-right subtotal">${formatCurrency(item.subtotal)}</td>
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
    <title>Factura ${data.invoiceNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f8fafc;
        padding: 20px;
        color: #1a202c;
        line-height: 1.6;
      }

      .invoice-wrapper {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1a202c;
        line-height: 1.6;
      }

      .invoice-container {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      /* Header */
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
        font-size: 16px;
        font-weight: 800;
        color: #4f46e5;
      }

      .logo-icon svg {
        width: 28px;
        height: 28px;
      }

      /* Print Button */
      .print-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 24px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        z-index: 1000;
      }

      .print-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
      }

      .print-button:active {
        transform: translateY(0);
      }

      .print-button svg {
        width: 18px;
        height: 18px;
      }

      @media print {
        .print-button {
          display: none !important;
        }
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

      .cancelled-badge {
        display: inline-block;
        background: #ef4444;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        margin-top: 12px;
      }

      /* Body */
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

      .client-contact {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #64748b;
      }

      /* Items */
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
      }

      .items-table tbody td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .product-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .product-image-container {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
      }

      .product-image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-image-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        flex-shrink: 0;
        border: 1px solid #e2e8f0;
      }

      .product-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .product-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 13px;
      }

      .product-description {
        font-size: 11px;
        color: #64748b;
      }

      .quantity-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        background: #f1f5f9;
        border-radius: 6px;
        font-weight: 600;
        color: #475569;
        font-size: 12px;
      }

      .unit-price {
        color: #64748b;
        font-size: 13px;
      }

      .subtotal {
        font-weight: 600;
        color: #1e293b;
        font-size: 13px;
      }

      .text-center { text-align: center; }
      .text-right { text-align: right; }

      /* Totals */
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

      /* Footer */
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

      .footer-icon svg {
        width: 16px;
        height: 16px;
        color: white;
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

      /* Print styles */
      @media print {
        body {
          background: white;
          padding: 0;
        }
        
        .invoice-container {
          box-shadow: none;
          border-radius: 0;
        }
        
        .invoice-wrapper {
          background: white;
        }
      }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="header-content">
            <div class="company-section">
              <div class="logo-container">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div class="company-name">${data.companyName}</div>
              </div>
              <div class="company-details">
                <strong>NIF:</strong> ${data.companyTaxId}<br>
                ${data.companyAddress}<br>
                ${data.companyPostalCode} ${data.companyCity}, ${data.companyProvince}
                ${data.companyPhone ? `<br>📞 ${data.companyPhone}` : ''}
                ${data.companyEmail ? `<br>✉ ${data.companyEmail}` : ''}
              </div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-label">Factura</div>
              <div class="invoice-number">${data.invoiceNumber}</div>
              <div class="invoice-date">${fechaEmision}</div>
              ${data.isCancelled ? '<div class="cancelled-badge">Factura Anulada</div>' : ''}
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="invoice-body">
          <!-- Client Info -->
          <div class="client-section">
            <div class="client-card">
              <div class="section-label">Facturar a</div>
              <div class="client-name">${data.clientName}</div>
              <div class="client-details">
                <strong>NIF:</strong> ${data.clientTaxId || 'No especificado'}<br>
                ${data.clientAddress}<br>
                ${data.clientPostalCode} ${data.clientCity}, ${data.clientProvince}<br>
                ${data.clientCountry || 'España'}
              </div>
              ${getClientContactHTML(data)}
            </div>

            <div class="client-card">
              <div class="section-label">Información del pedido</div>
              <div class="client-details">
                <strong>Pedido:</strong> ${data.orderNumber || 'N/A'}<br>
                <strong>Método de pago:</strong> ${getPaymentMethodName(data.paymentMethod)}<br>
                <strong>Fecha de emisión:</strong> ${fechaEmision}
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="items-section">
            <div class="section-header">
              <h3 class="section-title">Conceptos</h3>
              <span class="items-count">${data.items.length} producto${data.items.length === 1 ? '' : 's'}</span>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50%">Producto</th>
                  <th style="width: 15%" class="text-center">Cant.</th>
                  <th style="width: 20%" class="text-right">Precio</th>
                  <th style="width: 15%" class="text-right">Importe</th>
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
                <span>${formatCurrency(data.subtotal)}</span>
              </div>
              <div class="totals-row">
                <span>Envío</span>
                <span>${formatCurrency(data.shipping)}</span>
              </div>
              <div class="totals-row">
                <span>IVA (${data.vatRate}%)</span>
                <span>${formatCurrency(data.vatAmount)}</span>
              </div>
              <div class="totals-row total-row">
                <span>TOTAL</span>
                <span>${formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
          <div class="footer-grid">
            <div class="footer-block">
              <div class="footer-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>
              <div class="footer-content">
                <h4>Método de pago</h4>
                <p>${getPaymentMethodName(data.paymentMethod)}</p>
              </div>
            </div>
            ${
              data.orderNumber
                ? `
            <div class="footer-block">
              <div class="footer-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <div class="footer-content">
                <h4>Pedido</h4>
                <p>${data.orderNumber}</p>
              </div>
            </div>
            `
                : ''
            }
          </div>

          <div class="footer-note">
            <strong>${data.companyName}</strong> · ${data.companyCity}, ${data.companyProvince}<br>
            Factura generada electrónicamente · Este documento es válido sin firma según la normativa vigente<br>
            ${data.companyEmail ? `Contacto: ${data.companyEmail}` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Print Button -->
    <button class="print-button" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Imprimir
    </button>
</body>
</html>
  `;
}
