/**
 * API de Descarga de Factura para Usuarios
 * Permite a los usuarios descargar sus propias facturas
 * 
 * GET /api/account/invoices/[id]/pdf
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';

// Type for invoice with order
 type InvoiceWithOrder = Prisma.InvoiceGetPayload<{
  include: {
    order: {
      include: {
        items: {
          include: {
            product: true;
          };
        };
      };
    };
  };
}>;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const factura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la factura pertenece al usuario
    if (factura.order?.userId !== usuario.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Generar HTML de la factura
    const html = generarHTMLFactura(factura);

    // Retornar como HTML con headers para descarga
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

function generarHTMLFactura(factura: InvoiceWithOrder): string {
  const items = factura.order?.items || [];
  const fechaEmision = new Date(factura.issuedAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura ${factura.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 40px 20px;
            line-height: 1.6;
            color: #2d3748;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            position: relative;
        }
        
        .invoice-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            opacity: 0.1;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 1;
        }
        
        .company-section h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .company-section .company-details {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.8;
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        .invoice-meta h2 {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.8;
            margin-bottom: 12px;
        }
        
        .invoice-number {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .invoice-date {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .cancelled-badge {
            display: inline-block;
            background: #e53e3e;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 12px;
        }
        
        .invoice-body {
            padding: 40px;
        }
        
        .client-section {
            background: #f7fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
        }
        
        .client-section h3 {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #718096;
            margin-bottom: 12px;
        }
        
        .client-section .client-name {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
        }
        
        .client-section .client-details {
            font-size: 14px;
            color: #4a5568;
            line-height: 1.8;
        }
        
        .items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 32px;
        }
        
        .items-table thead th {
            background: #edf2f7;
            padding: 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .items-table thead th:last-child {
            text-align: right;
        }
        
        .items-table tbody td {
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        .items-table tbody td:last-child {
            text-align: right;
            font-weight: 600;
            color: #2d3748;
        }
        
        .items-table tbody tr:hover {
            background: #f7fafc;
        }
        
        .item-description {
            font-weight: 500;
            color: #2d3748;
        }
        
        .item-quantity {
            color: #718096;
            font-weight: 500;
        }
        
        .item-price {
            color: #4a5568;
        }
        
        .totals-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 24px;
            color: white;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .totals-row.total-row {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid rgba(255, 255, 255, 0.2);
            font-size: 24px;
            font-weight: 700;
            opacity: 1;
        }
        
        .invoice-footer {
            padding: 32px 40px;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .payment-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #4a5568;
        }
        
        .payment-method {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .payment-label {
            font-weight: 600;
            color: #2d3748;
        }
        
        .footer-note {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #a0aec0;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="header-content">
                <div class="company-section">
                    <h1>${factura.companyName}</h1>
                    <div class="company-details">
                        NIF: ${factura.companyTaxId}<br>
                        ${factura.companyAddress}<br>
                        ${factura.companyPostalCode} ${factura.companyCity}, ${factura.companyProvince}
                    </div>
                </div>
                <div class="invoice-meta">
                    <h2>Factura</h2>
                    <div class="invoice-number">${factura.invoiceNumber}</div>
                    <div class="invoice-date">${fechaEmision}</div>
                    ${factura.isCancelled ? '<div class="cancelled-badge">Factura Anulada</div>' : ''}
                </div>
            </div>
        </div>

        <div class="invoice-body">
            <div class="client-section">
                <h3>Facturar a</h3>
                <div class="client-name">${factura.clientName}</div>
                <div class="client-details">
                    NIF: ${factura.clientTaxId}<br>
                    ${factura.clientAddress}<br>
                    ${factura.clientPostalCode} ${factura.clientCity}<br>
                    ${factura.clientProvince}, ${factura.clientCountry}
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%">Concepto</th>
                        <th style="width: 15%">Cantidad</th>
                        <th style="width: 20%">Precio</th>
                        <th style="width: 15%">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item) => `
                    <tr>
                        <td>
                            <div class="item-description">${item.name}</div>
                        </td>
                        <td class="item-quantity">${item.quantity}</td>
                        <td class="item-price">${Number(item.price).toFixed(2)} €</td>
                        <td>${Number(item.subtotal).toFixed(2)} €</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals-section">
                <div class="totals-row">
                    <span>Base Imponible</span>
                    <span>${Number(factura.taxableAmount).toFixed(2)} €</span>
                </div>
                <div class="totals-row">
                    <span>IVA (${factura.vatRate}%)</span>
                    <span>${Number(factura.vatAmount).toFixed(2)} €</span>
                </div>
                <div class="totals-row total-row">
                    <span>Total</span>
                    <span>${Number(factura.total).toFixed(2)} €</span>
                </div>
            </div>
        </div>

        <div class="invoice-footer">
            <div class="payment-info">
                <div class="payment-method">
                    <span class="payment-label">Método de pago:</span>
                    <span>${factura.order?.paymentMethod === 'CARD' ? 'Tarjeta de crédito/débito' : factura.order?.paymentMethod === 'PAYPAL' ? 'PayPal' : factura.order?.paymentMethod === 'BIZUM' ? 'Bizum' : factura.order?.paymentMethod === 'TRANSFER' ? 'Transferencia bancaria' : 'Tarjeta de crédito/débito'}</span>
                </div>
                <div class="order-ref">
                    Pedido: ${factura.order?.orderNumber || 'N/A'}
                </div>
            </div>
            <div class="footer-note">
                Gracias por su compra · 3D Print · Barcelona, España
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
