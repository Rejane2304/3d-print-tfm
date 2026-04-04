/**
 * Tests Helpers - Consolidated
 * 
 * Simplified utility functions for tests
 */

import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '../src/lib/db/prisma';

// Re-export the prisma instance from the main app for tests
const prisma = prismaInstance;

/**
 * Cleans the test database
 * Truncates all tables in correct order to respect FKs
 */
export async function cleanupDB(): Promise<void> {
  const tables = [
    'audit_logs',
    'verification_tokens',
    'sessions',
    'order_messages',
    'alerts',
    'inventory_movements',
    'payments',
    'order_items',
    'cart_items',
    'carts',
    'orders',
    'invoices',
    'product_images',
    'reviews',
    'products',
    'categories',
    'addresses',
    'coupons',
    'users',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Ignore errors if table doesn't exist or is already empty
    }
  }
}

/**
 * Creates basic test data
 * Minimum users and products required
 */
export async function seedTestData(): Promise<void> {
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('test123', 10);

  // Create test users
  await prisma.user.createMany({
    data: [
      {
        id: 'test-admin-id',
        email: 'admin@test.com',
        name: 'Admin Test',
        password: passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      {
        id: 'test-client-id',
        email: 'customer@test.com',
        name: 'Customer Test',
        password: passwordHash,
        role: 'CUSTOMER',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

      // Create test categories
  await prisma.category.createMany({
    data: [
      {
        id: 'test-category-decoration',
        name: 'Decoration',
        slug: 'decoration',
        isActive: true,
      },
      {
        id: 'test-category-accessories',
        name: 'Accessories',
        slug: 'accessories',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // Create test products
  await prisma.product.createMany({
    data: [
      {
        id: 'test-product-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        description: 'Description of test product',
        price: 19.99,
        stock: 10,
        categoryId: 'test-category-decoration',
        material: 'PLA',
        isActive: true,
      },
      {
        id: 'test-product-2',
        slug: 'test-product-2',
        name: 'Test Product 2',
        description: 'Another test product',
        price: 29.99,
        stock: 5,
        categoryId: 'test-category-accessories',
        material: 'PETG',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // Create images
  await prisma.productImage.createMany({
    data: [
      {
        id: 'test-img-1',
        productId: 'test-product-1',
        url: 'https://example.com/img1.jpg',
        filename: 'img1.jpg',
        altText: 'Product 1',
        isMain: true,
        displayOrder: 0,
      },
      {
        id: 'test-img-2',
        productId: 'test-product-2',
        url: 'https://example.com/img2.jpg',
        filename: 'img2.jpg',
        altText: 'Product 2',
        isMain: true,
        displayOrder: 0,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * Validates that we are using a test database
 * Throws error if production is detected
 */
export async function validateTestDB(): Promise<void> {
  const url = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test') {
    throw new Error(
      `NODE_ENV must be 'test', but is '${nodeEnv}'\n` +
      `You are trying to run tests against a ${nodeEnv} database!`
    );
  }

  // Detect production database
  const isProdUrl = 
    url.includes('/postgres?') ||
    url.includes(':5432/postgres') ||
    url.includes('prod') ||
    url.includes('production');

  if (isProdUrl) {
    throw new Error(
      `Detected attempt to run tests against PRODUCTION database\n` +
      `DATABASE_URL: ${url}\n` +
      `Create a separate database for tests`
    );
  }

  if (!url.includes('test') && !url.includes(':5433')) {
    console.warn('⚠️  DATABASE_URL does not contain "test" - are you sure?');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('✅ DB Validation: OK');
}

/**
 * Waits a specific time
 * Useful for waiting for the database to persist data
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets information about the current database
 */
export function getDBInfo() {
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';

  return {
    database: dbName,
    isTest: dbName.includes('test') || url.includes(':5433'),
    isProduction: url.includes('prod') || url.includes('production'),
  };
}

export { prisma };
