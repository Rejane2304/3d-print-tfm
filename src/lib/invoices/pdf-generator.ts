/**
 * PDF Generator Service
 * Genera PDFs a partir de HTML usando Puppeteer
 */
import puppeteer from 'puppeteer';
import { getCompanyDataForInvoice, getDefaultVatRate } from '@/lib/site-config';

interface PDFOptions {
  html: string;
}

export async function generatePDF({ html }: PDFOptions): Promise<Buffer> {
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
    
    // Wait for all images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve); // Resolve on error to not block
          }))
      );
    });

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
 * Get company configuration from database
 * This function loads the current site config and returns it in the format expected by the invoice template
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
    phone: '+34 930 000 001', // Default phone
    email: 'info@3dprint.com', // Default email
    vatRate,
  };
}

/**
 * @deprecated Use getCompanyConfig() instead for dynamic company data
 * This is kept for backward compatibility
 */
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
