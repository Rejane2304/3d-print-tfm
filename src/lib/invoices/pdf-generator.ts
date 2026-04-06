/**
 * PDF Generator Service
 * Genera PDFs a partir de HTML usando Puppeteer
 */
import puppeteer from 'puppeteer';

interface PDFOptions {
  html: string;
  filename: string;
}

export async function generatePDF({ html, filename }: PDFOptions): Promise<Buffer> {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Set HTML content
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF
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

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * Datos de la empresa desde la configuración
 * En producción, estos deberían venir de la BD o variables de entorno
 */
export const COMPANY_CONFIG = {
  name: '3D Print Shop S.L.',
  taxId: 'B12345678',
  address: 'Calle Innovación 42',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
  phone: '+34 910 000 001',
  email: 'info@3dprint.com',
  vatRate: 21,
} as const;
