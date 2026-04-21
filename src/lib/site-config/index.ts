/**
 * Site Config Module with Caching
 * Server-side functions for managing site configuration
 * Optimized for Session Mode with memory caching
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { memoryCache, CACHE_TTL } from '@/lib/cache/memory-cache';
import type { Prisma } from '@prisma/client';

const SITE_CONFIG_ID = 'site-config';
const CACHE_KEY = 'site:config';

// Type from Prisma
export type SiteConfig = Prisma.SiteConfigGetPayload<Record<string, never>>;

/**
 * Get or create the site configuration (singleton) - Cached
 */
export async function getSiteConfig(): Promise<SiteConfig | null> {
  return memoryCache.getOrSet(
    CACHE_KEY,
    async () => {
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
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        logger.error('Error getting site config:', error);
        return null;
      }
    },
    CACHE_TTL.SITE_CONFIG,
  );
}

/**
 * Update site configuration - Clears cache
 */
export async function updateSiteConfig(data: Omit<SiteConfig, 'id' | 'updatedAt'>): Promise<SiteConfig | null> {
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
        updatedAt: new Date(),
      },
    });

    // Clear cache after update
    memoryCache.clear(CACHE_KEY);

    return config;
  } catch (error) {
    logger.error('Error updating site config:', error);
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
  if (!config) {
    return null;
  }

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
  if (!config?.defaultVatRate) {
    return 21;
  }
  // Handle Decimal from Prisma
  const vatRate = config.defaultVatRate;
  return typeof vatRate === 'object' && 'toNumber' in vatRate
    ? (vatRate as { toNumber: () => number }).toNumber()
    : Number(vatRate);
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
  if (!config) {
    return null;
  }

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
