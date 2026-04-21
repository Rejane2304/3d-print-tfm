/**
 * Products Service with Caching
 * Optimized for Supabase Session Mode with limited connections
 */

import { prisma } from '@/lib/db/prisma';
import { memoryCache, CACHE_TTL } from '@/lib/cache/memory-cache';
import type { Prisma } from '@prisma/client';

// Cache keys
const CACHE_KEYS = {
  FEATURED_PRODUCTS: 'products:featured',
  CATEGORIES: 'categories:all',
};

// Product type with translations
export type ProductWithImages = Prisma.ProductGetPayload<{
  include: {
    images: { where: { isMain: true }; take: 1 };
  };
}>;

/**
 * Get featured products - Cached for 2 minutes
 * Reduces DB connections by caching frequently accessed data
 */
export async function getFeaturedProducts(
  count = 3,
): Promise<Array<ProductWithImages & { name: string; description: string }>> {
  const cacheKey = `${CACHE_KEYS.FEATURED_PRODUCTS}:${count}`;

  return memoryCache.getOrSet(
    cacheKey,
    async () => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        include: {
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: count,
      });

      return products.map(product => ({
        ...product,
        name: product.nameEs, // Use bilingual field
        description: product.descriptionEs,
      }));
    },
    CACHE_TTL.PRODUCTS,
  );
}

/**
 * Get categories - Cached for 5 minutes
 */
export async function getCategories() {
  return memoryCache.getOrSet(
    CACHE_KEYS.CATEGORIES,
    async () => {
      return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 10, // Limit to most used
      });
    },
    CACHE_TTL.CATEGORIES,
  );
}

/**
 * Clear products cache (call after product update)
 */
export function clearProductsCache(): void {
  memoryCache.clear(CACHE_KEYS.FEATURED_PRODUCTS);
}

/**
 * Clear categories cache
 */
export function clearCategoriesCache(): void {
  memoryCache.clear(CACHE_KEYS.CATEGORIES);
}
