/**
 * Serverless PDF Generator using pdf-lib
 * Works in production (Vercel) without Puppeteer
 * Enhanced design to match development HTML layout
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

// Color palette matching the HTML design
const colors = {
  primary: { r: 0.31, g: 0.27, b: 0.9 }, // #4f46e5
  primaryDark: { r: 0.49, g: 0.23, b: 0.93 }, // #7c3aed
  secondary: { r: 0.12, g: 0.16, b: 0.22 }, // #1e293b
  text: { r: 0.13, g: 0.16, b: 0.22 }, // #1e293b
  textLight: { r: 0.37, g: 0.41, b: 0.51 }, // #64748b
  textMuted: { r: 0.42, g: 0.45, b: 0.51 }, // #64748b
  border: { r: 0.89, g: 0.91, b: 0.94 }, // #e2e8f0
  background: { r: 0.97, g: 0.98, b: 0.99 }, // #f8fafc
  white: { r: 1, g: 1, b: 1 },
  danger: { r: 0.93, g: 0.26, b: 0.27 }, // #ef4444
  dangerBg: { r: 0.99, g: 0.89, b: 0.89 }, // #fee2e2
};

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

  const margin = 50;
  let y = height - 60;

  // ========== HEADER WITH GRADIENT BACKGROUND ==========
  // Draw gradient header background (simulated with rectangles)
  const headerHeight = 140;

  // Main header background
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  // Secondary accent (top-right corner effect)
  page.drawRectangle({
    x: width * 0.6,
    y: height - headerHeight,
    width: width * 0.4,
    height: headerHeight,
    color: rgb(colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b),
    opacity: 0.3,
  });

  // Decorative circle in header
  page.drawCircle({
    x: width - 80,
    y: height - 50,
    size: 40,
    color: rgb(1, 1, 1),
    opacity: 0.1,
  });

  // Company name in header (white text on colored background)
  page.drawText(data.companyName, {
    x: margin,
    y: height - 55,
    size: 26,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Company info in header (lighter text)
  y = height - 85;
  page.drawText(`${data.companyAddress}, ${data.companyPostalCode} ${data.companyCity}`, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.9, 0.9, 1),
  });
  y -= 14;
  page.drawText(`NIF: ${data.companyTaxId} | ${data.companyEmail} | ${data.companyPhone}`, {
    x: margin,
    y,
    size: 8,
    font: helvetica,
    color: rgb(0.8, 0.8, 1),
  });

  // Invoice info box (white card on right side)
  const infoBoxX = width - margin - 180;
  const infoBoxY = height - 120;
  page.drawRectangle({
    x: infoBoxX,
    y: infoBoxY,
    width: 180,
    height: 100,
    color: rgb(1, 1, 1),
    borderColor: rgb(colors.border.r, colors.border.g, colors.border.b),
    borderWidth: 1,
  });

  // Invoice title and number in box
  page.drawText('FACTURA', {
    x: infoBoxX + 10,
    y: infoBoxY + 75,
    size: 11,
    font: helveticaBold,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });

  page.drawText(data.invoiceNumber, {
    x: infoBoxX + 10,
    y: infoBoxY + 55,
    size: 16,
    font: helveticaBold,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  page.drawText(`Fecha de emisión:`, {
    x: infoBoxX + 10,
    y: infoBoxY + 35,
    size: 8,
    font: helvetica,
    color: rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b),
  });

  page.drawText(formatDate(data.issuedAt), {
    x: infoBoxX + 10,
    y: infoBoxY + 20,
    size: 10,
    font: helveticaBold,
    color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
  });

  // ========== CLIENT SECTION ==========
  y = height - headerHeight - 30;

  // Section title with accent line
  page.drawRectangle({
    x: margin,
    y: y,
    width: 4,
    height: 20,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  page.drawText('DATOS DEL CLIENTE', {
    x: margin + 12,
    y: y + 3,
    size: 10,
    font: helveticaBold,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  y -= 30;

  // Client name (large)
  page.drawText(data.clientName, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
  });
  y -= 22;

  // Client details
  if (data.clientTaxId) {
    page.drawText(`NIF/CIF: ${data.clientTaxId}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
    });
    y -= 16;
  }

  if (data.clientAddress) {
    page.drawText(`${data.clientAddress}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
    });
    y -= 16;

    page.drawText(`${data.clientPostalCode} ${data.clientCity}, ${data.clientProvince}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
    });
    y -= 16;

    if (data.clientCountry) {
      page.drawText(data.clientCountry, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
      });
      y -= 16;
    }
  }

  // Contact info
  const contactInfo = [];
  if (data.clientEmail) contactInfo.push(data.clientEmail);
  if (data.clientPhone) contactInfo.push(data.clientPhone);

  if (contactInfo.length > 0) {
    y -= 5;
    page.drawText(contactInfo.join(' · '), {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
    });
  }

  // ========== ITEMS TABLE ==========
  y -= 35;

  // Table header with gradient background
  const tableHeaderY = y + 10;
  page.drawRectangle({
    x: margin,
    y: tableHeaderY - 5,
    width: width - margin * 2,
    height: 35,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  // Table headers
  page.drawText('PRODUCTO', {
    x: margin + 12,
    y: tableHeaderY,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('CANT.', {
    x: margin + 240,
    y: tableHeaderY,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('PRECIO', {
    x: margin + 310,
    y: tableHeaderY,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('TOTAL', {
    x: width - margin - 70,
    y: tableHeaderY,
    size: 9,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Table rows
  y -= 35;
  data.items.forEach((item, index) => {
    const rowY = y - index * 28;
    const isEven = index % 2 === 1;

    // Alternating row background
    if (isEven) {
      page.drawRectangle({
        x: margin,
        y: rowY - 8,
        width: width - margin * 2,
        height: 28,
        color: rgb(colors.background.r, colors.background.g, colors.background.b),
      });
    }

    // Item name (truncated if too long)
    const displayName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
    page.drawText(displayName, {
      x: margin + 12,
      y: rowY,
      size: 9,
      font: helveticaBold,
      color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
    });

    // Quantity with badge-like styling
    const qtyStr = item.quantity.toString();
    page.drawText(qtyStr, {
      x: margin + 248,
      y: rowY,
      size: 9,
      font: helveticaBold,
      color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
    });

    // Price
    const priceText = formatCurrency(item.price);
    const priceWidth = helvetica.widthOfTextAtSize(priceText, 9);
    page.drawText(priceText, {
      x: margin + 360 - priceWidth,
      y: rowY,
      size: 9,
      font: helvetica,
      color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
    });

    // Subtotal
    const totalText = formatCurrency(item.subtotal);
    const totalWidth = helvetica.widthOfTextAtSize(totalText, 9);
    page.drawText(totalText, {
      x: width - margin - 12 - totalWidth,
      y: rowY,
      size: 9,
      font: helveticaBold,
      color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
    });
  });

  // ========== TOTALS SECTION ==========
  y -= data.items.length * 28 + 40;
  const totalsX = width - margin - 220;

  // Totals card background
  page.drawRectangle({
    x: totalsX - 15,
    y: y - 100,
    width: 235,
    height: 110,
    color: rgb(1, 1, 1),
    borderColor: rgb(colors.border.r, colors.border.g, colors.border.b),
    borderWidth: 1,
  });

  // Subtotal
  y -= 5;
  page.drawText('Subtotal productos', {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  const subtotalText = formatCurrency(data.subtotal);
  const subtotalWidth = helvetica.widthOfTextAtSize(subtotalText, 10);
  page.drawText(subtotalText, {
    x: width - margin - 12 - subtotalWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  y -= 22;

  // Shipping
  page.drawText('Envío', {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  const shippingText = formatCurrency(data.shipping);
  const shippingWidth = helvetica.widthOfTextAtSize(shippingText, 10);
  page.drawText(shippingText, {
    x: width - margin - 12 - shippingWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  y -= 22;

  // VAT
  page.drawText(`IVA (${data.vatRate}%)`, {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  const vatText = formatCurrency(data.vatAmount);
  const vatWidth = helvetica.widthOfTextAtSize(vatText, 10);
  page.drawText(vatText, {
    x: width - margin - 12 - vatWidth,
    y,
    size: 10,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });
  y -= 25;

  // Separator line
  page.drawLine({
    start: { x: totalsX, y },
    end: { x: width - margin - 12, y },
    thickness: 1,
    color: rgb(colors.border.r, colors.border.g, colors.border.b),
  });
  y -= 18;

  // Grand Total
  page.drawText('TOTAL', {
    x: totalsX,
    y,
    size: 13,
    font: helveticaBold,
    color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
  });
  const grandTotalText = formatCurrency(data.total);
  const grandTotalWidth = helveticaBold.widthOfTextAtSize(grandTotalText, 16);
  page.drawText(grandTotalText, {
    x: width - margin - 12 - grandTotalWidth,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
  });

  // ========== PAYMENT INFO ==========
  y -= 40;
  const paymentY = y;

  // Payment card
  page.drawRectangle({
    x: margin,
    y: paymentY - 35,
    width: 300,
    height: 50,
    color: rgb(colors.background.r, colors.background.g, colors.background.b),
  });

  page.drawText('MÉTODO DE PAGO', {
    x: margin + 12,
    y: paymentY,
    size: 8,
    font: helveticaBold,
    color: rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b),
  });

  page.drawText(getPaymentMethodName(data.paymentMethod), {
    x: margin + 12,
    y: paymentY - 18,
    size: 10,
    font: helveticaBold,
    color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
  });

  if (data.orderNumber) {
    page.drawText('Nº PEDIDO', {
      x: margin + 160,
      y: paymentY,
      size: 8,
      font: helveticaBold,
      color: rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b),
    });

    page.drawText(data.orderNumber, {
      x: margin + 160,
      y: paymentY - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(colors.secondary.r, colors.secondary.g, colors.secondary.b),
    });
  }

  // ========== FOOTER ==========
  const footerY = 60;

  // Footer line
  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1,
    color: rgb(colors.border.r, colors.border.g, colors.border.b),
  });

  // Footer text
  const footerLine1 = `${data.companyName} · ${data.companyAddress}, ${data.companyPostalCode} ${data.companyCity}`;
  const footerLine1Width = helvetica.widthOfTextAtSize(footerLine1, 8);
  page.drawText(footerLine1, {
    x: (width - footerLine1Width) / 2,
    y: footerY,
    size: 8,
    font: helvetica,
    color: rgb(colors.textLight.r, colors.textLight.g, colors.textLight.b),
  });

  const footerLine2 =
    'Factura generada electrónicamente · Este documento es válido sin firma según la normativa vigente';
  const footerLine2Width = helvetica.widthOfTextAtSize(footerLine2, 7);
  page.drawText(footerLine2, {
    x: (width - footerLine2Width) / 2,
    y: footerY - 12,
    size: 7,
    font: helvetica,
    color: rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b),
  });

  // ========== CANCELLED STAMP ==========
  if (data.isCancelled) {
    // Large rotated "ANULADA" stamp
    const stampWidth = 200;
    const stampHeight = 80;
    const stampX = (width - stampWidth) / 2;
    const stampY = height / 2;

    // Stamp background
    page.drawRectangle({
      x: stampX,
      y: stampY,
      width: stampWidth,
      height: stampHeight,
      color: rgb(colors.dangerBg.r, colors.dangerBg.g, colors.dangerBg.b),
      borderColor: rgb(colors.danger.r, colors.danger.g, colors.danger.b),
      borderWidth: 4,
    });

    page.drawText('ANULADA', {
      x: stampX + 25,
      y: stampY + 28,
      size: 36,
      font: helveticaBold,
      color: rgb(colors.danger.r, colors.danger.g, colors.danger.b),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
