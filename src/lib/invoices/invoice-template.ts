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
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry?: string;
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

  const itemsHTML = data.items.map((item, index) => `
    <tr class="${index % 2 === 0 ? '' : 'bg-gray-50'}">
      <td class="py-4 px-4">
        <div class="flex items-center gap-3">
          ${item.image ? `
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover bg-gray-100">
          ` : `
            <div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          `}
          <span class="font-medium text-gray-900">${item.name}</span>
        </div>
      </td>
      <td class="py-4 px-4 text-center text-gray-600">${item.quantity}</td>
      <td class="py-4 px-4 text-right text-gray-600">${formatCurrency(item.price)}</td>
      <td class="py-4 px-4 text-right font-medium text-gray-900">${formatCurrency(item.subtotal)}</td>
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
        max-width: 900px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
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
        font-size: 24px;
        font-weight: 700;
        color: #4f46e5;
      }
      
      .company-name {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }
      
      .company-details {
        font-size: 14px;
        opacity: 0.9;
        line-height: 1.8;
        margin-top: 8px;
      }
      
      .invoice-meta {
        text-align: right;
        flex-shrink: 0;
      }
      
      .invoice-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        opacity: 0.8;
        margin-bottom: 8px;
      }
      
      .invoice-number {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: -1px;
      }
      
      .invoice-date {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 8px;
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
      
      /* Client Info */
      .client-section {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 40px;
        border: 1px solid #e2e8f0;
      }
      
      .section-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 12px;
      }
      
      .client-name {
        font-size: 22px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      
      .client-details {
        font-size: 14px;
        color: #475569;
        line-height: 1.8;
      }
      
      /* Items Table */
      .items-section {
        margin-bottom: 40px;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .items-table thead th {
        background: #f8fafc;
        padding: 16px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .items-table thead th:last-child {
        text-align: right;
      }
      
      .items-table tbody td {
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }
      
      /* Totals Section */
      .totals-section {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        border-radius: 16px;
        padding: 32px;
        color: white;
        margin-bottom: 32px;
      }
      
      .totals-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        opacity: 0.9;
      }
      
      .totals-row:last-child {
        margin-bottom: 0;
      }
      
      .totals-row.total-row {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid rgba(255, 255, 255, 0.2);
        font-size: 28px;
        font-weight: 700;
        opacity: 1;
      }
      
      /* Footer Section */
      .invoice-footer {
        padding: 32px 48px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 24px;
      }
      
      .footer-block {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .footer-icon {
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      
      .footer-icon svg {
        width: 20px;
        height: 20px;
        color: #4f46e5;
      }
      
      .footer-content h4 {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .footer-content p {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
      }
      
      .footer-note {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #94a3b8;
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
      }
      
      /* Responsive */
      @media (max-width: 640px) {
        .header-content {
          flex-direction: column;
          gap: 24px;
        }
        
        .invoice-meta {
          text-align: left;
        }
        
        .invoice-number {
          font-size: 28px;
        }
        
        .footer-grid {
          grid-template-columns: 1fr;
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
              <div class="logo-icon">3D</div>
              <div class="company-name">${data.companyName}</div>
            </div>
            <div class="company-details">
              NIF: ${data.companyTaxId}<br>
              ${data.companyAddress}<br>
              ${data.companyPostalCode} ${data.companyCity}, ${data.companyProvince}
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
          <div class="section-label">Facturar a</div>
          <div class="client-name">${data.clientName}</div>
          <div class="client-details">
            NIF: ${data.clientTaxId}<br>
            ${data.clientAddress}<br>
            ${data.clientPostalCode} ${data.clientCity}, ${data.clientProvince}<br>
            ${data.clientCountry || 'España'}
          </div>
        </div>

        <!-- Items -->
        <div class="items-section">
          <h3 class="section-title">Conceptos</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 45%">Producto</th>
                <th style="width: 15%; text-align: center">Cantidad</th>
                <th style="width: 20%; text-align: right">Precio unit.</th>
                <th style="width: 20%; text-align: right">Importe</th>
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
            <span>Subtotal productos</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>Envío</span>
            <span>${formatCurrency(data.shipping)}</span>
          </div>
          <div class="totals-row">
            <span>Base imponible</span>
            <span>${formatCurrency(data.taxableAmount)}</span>
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
          ${data.orderNumber ? `
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
          ` : ''}
        </div>
        
        <div class="footer-note">
          Factura generada electrónicamente · ${data.companyName} · Barcelona, España<br>
          Este documento es válido sin firma según la normativa vigente
        </div>
      </div>
    </div>
</body>
</html>
  `;
}
