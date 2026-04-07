/**
 * Site Config Module
 * Server-side functions for managing site configuration
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const SITE_CONFIG_ID = 'site-config';

// Type from Prisma
export type SiteConfig = Prisma.SiteConfigGetPayload<{}>;

/**
 * Get or create the site configuration (singleton)
 */
export async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
    });

    if (config) {
      return config;
    }

    // Create default config if not exists
    return await prisma.siteConfig.create({
      data: {
        id: SITE_CONFIG_ID,
        companyName: '3D Print',
        companyTaxId: 'B12345678',
        companyAddress: 'Calle Admin 123',
        companyCity: 'Barcelona',
        companyProvince: 'Barcelona',
        companyPostalCode: '08001',
        companyPhone: '+34930000001',
        companyEmail: 'info@3dprint.com',
        defaultVatRate: 21,
        lowStockThreshold: 5,
      },
    });
  } catch (error) {
    console.error('Error getting site config:', error);
    return null;
  }
}

/**
 * Update site configuration
 */
export async function updateSiteConfig(
  data: Omit<SiteConfig, 'id' | 'updatedAt'>
): Promise<SiteConfig | null> {
  try {
    const config = await prisma.siteConfig.upsert({
      where: { id: SITE_CONFIG_ID },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        id: SITE_CONFIG_ID,
        ...data,
      },
    });

    return config;
  } catch (error) {
    console.error('Error updating site config:', error);
    return null;
  }
}

/**
 * Get company data formatted for invoices
 */
export async function getCompanyDataForInvoice(): Promise<{
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
} | null> {
  const config = await getSiteConfig();
  if (!config) return null;

  return {
    companyName: config.companyName,
    companyTaxId: config.companyTaxId,
    companyAddress: config.companyAddress,
    companyCity: config.companyCity,
    companyProvince: config.companyProvince,
    companyPostalCode: config.companyPostalCode,
  };
}

/**
 * Get default VAT rate
 */
export async function getDefaultVatRate(): Promise<number> {
  const config = await getSiteConfig();
  return config?.defaultVatRate?.toNumber() || 21;
}

/**
 * Get low stock threshold
 */
export async function getLowStockThreshold(): Promise<number> {
  const config = await getSiteConfig();
  return config?.lowStockThreshold || 5;
}

/**
 * Get company contact info
 */
export async function getCompanyContact(): Promise<{
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
} | null> {
  const config = await getSiteConfig();
  if (!config) return null;

  return {
    companyName: config.companyName,
    companyEmail: config.companyEmail,
    companyPhone: config.companyPhone,
    companyAddress: config.companyAddress,
    companyCity: config.companyCity,
    companyProvince: config.companyProvince,
    companyPostalCode: config.companyPostalCode,
  };
}
