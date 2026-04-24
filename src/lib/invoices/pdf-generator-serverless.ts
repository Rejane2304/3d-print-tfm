/**
 * Serverless PDF Generator using pdf-lib
 * Works in production (Vercel) without Puppeteer
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  description?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date | string;
  isCancelled?: boolean;
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
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}

export async function generatePDFServerless(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.276, 841.89]); // A4 size

  const { width, height } = page.getSize();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getPaymentMethodName = (method?: string) => {
    const methods: Record<string, string> = {
      CARD: 'Tarjeta de crédito/débito',
      PAYPAL: 'PayPal',
      BIZUM: 'Bizum',
      TRANSFER: 'Transferencia bancaria',
    };
    return methods[method || ''] || method || 'No especificado';
  };

  let y = height - 50;
  const margin = 50;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _lineHeight = 14;

  // Header - Company Info
  page.drawText(data.companyName, {
    x: margin,
    y,
    size: 20,
    font: helveticaBold,
    color: rgb(0.31, 0.27, 0.9),
  });
  y -= 25;

  page.drawText(`NIF: ${data.companyTaxId}`, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(data.companyAddress, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(`${data.companyPostalCode} ${data.companyCity}, ${data.companyProvince}`, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(data.companyEmail, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(data.companyPhone, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Invoice Title (Right side)
  y = height - 50;
  const titleX = width - margin - 150;

  page.drawText('FACTURA', {
    x: titleX,
    y,
    size: 18,
    font: helveticaBold,
    color: rgb(0.12, 0.16, 0.22),
  });
  y -= 22;

  page.drawText(data.invoiceNumber, {
    x: titleX,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0.31, 0.27, 0.9),
  });
  y -= 18;

  page.drawText(`Fecha: ${formatDate(data.issuedAt)}`, {
    x: titleX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Separator line
  y = height - 160;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: rgb(0.31, 0.27, 0.9),
  });

  // Client Info
  y -= 25;
  page.drawText('DATOS DEL CLIENTE', {
    x: margin,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(0.31, 0.27, 0.9),
  });
  y -= 20;

  page.drawText(data.clientName, {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0.12, 0.16, 0.22),
  });
  y -= 16;

  if (data.clientTaxId) {
    page.drawText(`NIF/CIF: ${data.clientTaxId}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });
    y -= 14;
  }

  if (data.clientAddress) {
    page.drawText(data.clientAddress, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });
    y -= 14;

    page.drawText(`${data.clientPostalCode} ${data.clientCity}, ${data.clientProvince}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });
    y -= 14;

    if (data.clientCountry) {
      page.drawText(data.clientCountry, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.37, 0.41, 0.51),
      });
      y -= 14;
    }
  }

  if (data.clientEmail) {
    page.drawText(data.clientEmail, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });
    y -= 14;
  }

  if (data.clientPhone) {
    page.drawText(data.clientPhone, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });
    y -= 14;
  }

  // Items Table Header
  y -= 30;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tableY = y;

  // Table background
  page.drawRectangle({
    x: margin,
    y: y + 15,
    width: width - margin * 2,
    height: 25,
    color: rgb(0.31, 0.27, 0.9),
  });

  page.drawText('PRODUCTO', {
    x: margin + 5,
    y: y + 5,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('CANT.', {
    x: margin + 250,
    y: y + 5,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('PRECIO', {
    x: margin + 330,
    y: y + 5,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('TOTAL', {
    x: width - margin - 60,
    y: y + 5,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Items
  y -= 25;
  data.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: width - margin * 2,
        height: 20,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    page.drawText(item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name, {
      x: margin + 5,
      y,
      size: 9,
      font: helveticaBold,
      color: rgb(0.22, 0.24, 0.29),
    });

    page.drawText(item.quantity.toString(), {
      x: margin + 258,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });

    const priceText = formatCurrency(item.price);
    const priceWidth = helvetica.widthOfTextAtSize(priceText, 9);
    page.drawText(priceText, {
      x: margin + 360 - priceWidth,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });

    const totalText = formatCurrency(item.subtotal);
    const totalWidth = helvetica.widthOfTextAtSize(totalText, 9);
    page.drawText(totalText, {
      x: width - margin - 5 - totalWidth,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.37, 0.41, 0.51),
    });

    y -= 20;
  });

  // Totals Section
  y -= 30;
  const totalsX = width - margin - 200;

  // Subtotal
  page.drawText('Subtotal:', {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.42, 0.45, 0.51),
  });
  const subtotalText = formatCurrency(data.subtotal);
  const subtotalWidth = helvetica.widthOfTextAtSize(subtotalText, 10);
  page.drawText(subtotalText, {
    x: width - margin - 5 - subtotalWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.37, 0.41, 0.51),
  });
  y -= 18;

  // Shipping
  page.drawText('Envío:', {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.42, 0.45, 0.51),
  });
  const shippingText = formatCurrency(data.shipping);
  const shippingWidth = helvetica.widthOfTextAtSize(shippingText, 10);
  page.drawText(shippingText, {
    x: width - margin - 5 - shippingWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.37, 0.41, 0.51),
  });
  y -= 18;

  // VAT
  page.drawText(`IVA (${data.vatRate}%):`, {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.42, 0.45, 0.51),
  });
  const vatText = formatCurrency(data.vatAmount);
  const vatWidth = helvetica.widthOfTextAtSize(vatText, 10);
  page.drawText(vatText, {
    x: width - margin - 5 - vatWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.37, 0.41, 0.51),
  });
  y -= 22;

  // Total with background
  page.drawRectangle({
    x: totalsX - 10,
    y: y - 5,
    width: 210,
    height: 28,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText('TOTAL:', {
    x: totalsX,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0.12, 0.16, 0.22),
  });
  const grandTotalText = formatCurrency(data.total);
  const grandTotalWidth = helveticaBold.widthOfTextAtSize(grandTotalText, 14);
  page.drawText(grandTotalText, {
    x: width - margin - 5 - grandTotalWidth,
    y,
    size: 14,
    font: helveticaBold,
    color: rgb(0.31, 0.27, 0.9),
  });

  // Payment Info
  y -= 50;
  page.drawRectangle({
    x: margin,
    y: y - 25,
    width: width - margin * 2,
    height: 40,
    color: rgb(0.98, 0.98, 0.98),
  });

  page.drawText('MÉTODO DE PAGO:', {
    x: margin + 10,
    y: y - 10,
    size: 9,
    font: helveticaBold,
    color: rgb(0.42, 0.45, 0.51),
  });
  page.drawText(getPaymentMethodName(data.paymentMethod).toUpperCase(), {
    x: margin + 10,
    y: y - 25,
    size: 10,
    font: helvetica,
    color: rgb(0.22, 0.24, 0.29),
  });

  if (data.orderNumber) {
    page.drawText('PEDIDO:', {
      x: margin + 200,
      y: y - 10,
      size: 9,
      font: helveticaBold,
      color: rgb(0.42, 0.45, 0.51),
    });
    page.drawText(data.orderNumber, {
      x: margin + 200,
      y: y - 25,
      size: 10,
      font: helvetica,
      color: rgb(0.22, 0.24, 0.29),
    });
  }

  // Footer
  const footerY = 50;
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: width - margin, y: footerY + 15 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  const footerText = `${data.companyName} · ${data.companyCity}, ${data.companyProvince} | Factura generada electrónicamente | Este documento es válido sin firma según la normativa vigente`;
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: footerY,
    size: 8,
    font: helvetica,
    color: rgb(0.61, 0.64, 0.69),
  });

  // Cancelled Stamp
  if (data.isCancelled) {
    page.drawRectangle({
      x: width / 2 - 80,
      y: height / 2 + 40,
      width: 160,
      height: 50,
      color: rgb(0.99, 0.89, 0.89),
      borderColor: rgb(0.93, 0.26, 0.27),
      borderWidth: 3,
    });

    page.drawText('ANULADA', {
      x: width / 2 - 50,
      y: height / 2 + 55,
      size: 24,
      font: helveticaBold,
      color: rgb(0.93, 0.26, 0.27),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
