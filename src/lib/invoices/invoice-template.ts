/**
 * Invoice Template Component
 * Layout profesional y moderno para facturas
 * Usado en: Admin y User (unificado)
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
  // Datos de la empresa
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  companyPhone?: string;
  companyEmail?: string;
  // Datos del cliente
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry?: string;
  clientEmail?: string;
  clientPhone?: string;
  // Items y totales
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const fechaEmision = new Date(data.issuedAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const fechaAnulacion = data.cancelledAt
    ? new Date(data.cancelledAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);

  const getPaymentMethodName = (method?: string) => {
    const methods: Record<string, string> = {
      'CARD': 'Tarjeta de crédito/débito',
      'PAYPAL': 'PayPal',
      'BIZUM': 'Bizum',
      'TRANSFER': 'Transferencia bancaria'
    };
    return methods[method || ''] || 'Tarjeta de crédito/débito';
  };

  // SVG Logo inline
  const logoSVG = `
    <svg width="160" height="40" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(5, 10)">
        <path d="M16 4 L26 9 L26 19 L16 24 L16 14 Z" fill="white" opacity="0.7"/>
        <path d="M4 9 L16 14 L16 24 L4 19 Z" fill="white" opacity="0.9"/>
        <path d="M16 14 L26 9 L26 19 L16 24 Z" fill="white"/>
        <path d="M16 4 L26 9 L16 14 L4 9 Z" fill="white" opacity="0.5"/>
        <circle cx="26" cy="19" r="2.5" fill="#FBBF24"/>
      </g>
      <g transform="translate(50, 0)">
        <text x="0" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#FBBF24">3D</text>
        <text x="56" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="white">Print</text>
      </g>
      <rect x="50" y="44" width="130" height="2.5" rx="1.25" fill="url(#grad)"/>
      <defs>
        <linearGradient id="grad" x1="50" y1="45.25" x2="180" y2="45.25">
          <stop stop-color="white"/>
          <stop offset="1" stop-color="#FBBF24"/>
        </linearGradient>
      </defs>
    </svg>
  `;

  const itemsHTML = data.items.map((item, index) => `
    <tr class="${index % 2 === 0 ? '' : 'bg-gray-50'}">
      <td class="py-4 px-4">
        <div class="flex items-center gap-4">
          ${item.image ? `
            <div class="product-image-container">
              <img src="${item.image}" alt="${item.name}" class="product-image">
            </div>
          ` : `
            <div class="product-image-placeholder">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          `}
          <div class="product-info">
            <span class="product-name">${item.name}</span>
            ${item.description ? `<span class="product-description">${item.description}</span>` : ''}
          </div>
        </div>
      </td>
      <td class="py-4 px-4 text-center">
        <span class="quantity-badge">${item.quantity}</span>
      </td>
      <td class="py-4 px-4 text-right">
        <span class="unit-price">${formatCurrency(item.price)}</span>
      </td>
      <td class="py-4 px-4 text-right">
        <span class="subtotal">${formatCurrency(item.subtotal)}</span>
      </td>
    </tr>
  `).join('');

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
        background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
        min-height: 100vh;
        padding: 40px 20px;
        color: #1a202c;
        line-height: 1.6;
      }

      .invoice-container {
        max-width: 1000px;
        margin: 0 auto;
        background: white;
        border-radius: 24px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      /* Header Section */
      .invoice-header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 48px;
        position: relative;
      }

      .invoice-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.3;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
        z-index: 1;
      }

      .company-section {
        flex: 1;
      }

      .logo-container {
        margin-bottom: 20px;
      }

      .company-details-compact {
        font-size: 13px;
        opacity: 0.9;
        line-height: 1.7;
      }

      .company-details-compact strong {
        font-weight: 600;
        opacity: 1;
      }

      .invoice-meta {
        text-align: right;
        flex-shrink: 0;
        background: rgba(255,255,255,0.1);
        padding: 24px 32px;
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }

      .invoice-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        opacity: 0.8;
        margin-bottom: 8px;
      }

      .invoice-number {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -1px;
        margin-bottom: 4px;
      }

      .invoice-date {
        font-size: 14px;
        opacity: 0.9;
      }

      .cancelled-badge {
        display: inline-block;
        background: #ef4444;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 12px;
      }

      .cancelled-date {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 4px;
      }

      /* Body Section */
      .invoice-body {
        padding: 48px;
      }

      /* Client Info Cards */
      .client-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 40px;
      }

      .client-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px;
        padding: 28px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .client-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .section-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #64748b;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .section-label::before {
        content: '';
        width: 3px;
        height: 14px;
        background: #4f46e5;
        border-radius: 2px;
      }

      .client-name {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .client-details {
        font-size: 13px;
        color: #475569;
        line-height: 1.8;
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

      /* Items Table */
      .items-section {
        margin-bottom: 40px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e2e8f0;
      }

      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .items-count {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .items-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .items-table thead th {
        background: #f1f5f9;
        padding: 16px;
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        border-bottom: 2px solid #e2e8f0;
      }

      .items-table thead th:first-child {
        border-top-left-radius: 12px;
      }

      .items-table thead th:last-child {
        border-top-right-radius: 12px;
        text-align: right;
      }

      .items-table tbody td {
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
        padding: 16px;
      }

      .items-table tbody tr:last-child td:first-child {
        border-bottom-left-radius: 12px;
      }

      .items-table tbody tr:last-child td:last-child {
        border-bottom-right-radius: 12px;
      }

      /* Product styling */
      .product-image-container {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        overflow: hidden;
        background: #f1f5f9;
        flex-shrink: 0;
        border: 1px solid #e2e8f0;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .product-image-container:hover .product-image {
        transform: scale(1.05);
      }

      .product-image-placeholder {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
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
        gap: 4px;
      }

      .product-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
      }

      .product-description {
        font-size: 12px;
        color: #64748b;
        line-height: 1.4;
      }

      .quantity-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background: #f1f5f9;
        border-radius: 8px;
        font-weight: 600;
        color: #475569;
        font-size: 13px;
      }

      .unit-price {
        color: #64748b;
        font-size: 13px;
      }

      .subtotal {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
      }

      /* Totals Section */
      .totals-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 40px;
      }

      .totals-section {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-radius: 16px;
        padding: 32px;
        color: white;
        min-width: 380px;
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        color: #94a3b8;
      }

      .totals-row:last-child {
        margin-bottom: 0;
      }

      .totals-row.total-row {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid rgba(255, 255, 255, 0.1);
        font-size: 24px;
        font-weight: 700;
        color: white;
      }

      .totals-row .label {
        font-weight: 500;
      }

      .totals-row .value {
        font-family: 'Inter', monospace;
        font-variant-numeric: tabular-nums;
      }

      /* Footer Section */
      .invoice-footer {
        padding: 32px 48px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-top: 1px solid #e2e8f0;
      }

      .footer-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 24px;
      }

      .footer-block {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .footer-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .footer-icon svg {
        width: 20px;
        height: 20px;
        color: white;
      }

      .footer-content h4 {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .footer-content p {
        font-size: 14px;
        color: #1e293b;
        font-weight: 600;
      }

      .footer-note {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.6;
      }

      .footer-note strong {
        color: #64748b;
      }

      /* Print Styles */
      @media print {
        body {
          background: white;
          padding: 0;
        }

        .invoice-container {
          box-shadow: none;
          border-radius: 0;
        }

        .no-print {
          display: none !important;
        }

        .client-card {
          break-inside: avoid;
        }

        .items-table {
          break-inside: avoid;
        }

        .totals-section {
          break-inside: avoid;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 24px;
        }

        .invoice-meta {
          text-align: left;
          width: 100%;
        }

        .client-section {
          grid-template-columns: 1fr;
        }

        .footer-grid {
          grid-template-columns: 1fr;
        }

        .totals-section {
          min-width: 100%;
        }

        .items-table {
          font-size: 12px;
        }

        .product-image-container,
        .product-image-placeholder {
          width: 48px;
          height: 48px;
        }
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
              ${logoSVG}
            </div>
            <div class="company-details-compact">
              <strong>${data.companyName}</strong><br>
              NIF: ${data.companyTaxId}<br>
              ${data.companyAddress}, ${data.companyPostalCode} ${data.companyCity}<br>
              ${data.companyProvince}
              ${data.companyEmail ? `<br>📧 ${data.companyEmail}` : ''}
              ${data.companyPhone ? `<br>📞 ${data.companyPhone}` : ''}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-label">Factura</div>
            <div class="invoice-number">${data.invoiceNumber}</div>
            <div class="invoice-date">${fechaEmision}</div>
            ${data.isCancelled ? `
              <div class="cancelled-badge">Factura Anulada</div>
              ${fechaAnulacion ? `<div class="cancelled-date">Anulada el ${fechaAnulacion}</div>` : ''}
            ` : ''}
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
              <strong>NIF:</strong> ${data.clientTaxId}<br>
              ${data.clientAddress}<br>
              ${data.clientPostalCode} ${data.clientCity}, ${data.clientProvince}<br>
              ${data.clientCountry || 'España'}
            </div>
            ${data.clientEmail || data.clientPhone ? `
            <div class="client-contact">
              ${data.clientEmail ? `📧 ${data.clientEmail}` : ''}
              ${data.clientEmail && data.clientPhone ? ' · ' : ''}
              ${data.clientPhone ? `📞 ${data.clientPhone}` : ''}
            </div>
            ` : ''}
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
            <span class="items-count">${data.items.length} producto${data.items.length !== 1 ? 's' : ''}</span>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%">Producto</th>
                <th style="width: 15%; text-align: center">Cant.</th>
                <th style="width: 20%; text-align: right">Precio unit.</th>
                <th style="width: 15%; text-align: right">Importe</th>
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
              <span class="label">Subtotal productos</span>
              <span class="value">${formatCurrency(data.subtotal)}</span>
            </div>
            <div class="totals-row">
              <span class="label">Envío</span>
              <span class="value">${formatCurrency(data.shipping)}</span>
            </div>
            <div class="totals-row">
              <span class="label">Base imponible</span>
              <span class="value">${formatCurrency(data.taxableAmount)}</span>
            </div>
            <div class="totals-row">
              <span class="label">IVA (${data.vatRate}%)</span>
              <span class="value">${formatCurrency(data.vatAmount)}</span>
            </div>
            <div class="totals-row total-row">
              <span class="label">TOTAL</span>
              <span class="value">${formatCurrency(data.total)}</span>
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
          <div class="footer-block">
            <div class="footer-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <div class="footer-content">
              <h4>Pedido</h4>
              <p>${data.orderNumber || 'N/A'}</p>
            </div>
          </div>
          <div class="footer-block">
            <div class="footer-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="footer-content">
              <h4>Factura</h4>
              <p>${data.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div class="footer-note">
          <strong>${data.companyName}</strong> · Barcelona, España<br>
          Factura generada electrónicamente · Este documento es válido sin firma según la normativa vigente<br>
          ${data.companyEmail ? `Contacto: ${data.companyEmail}` : ''}
        </div>
      </div>
    </div>
</body>
</html>
  `;
}
