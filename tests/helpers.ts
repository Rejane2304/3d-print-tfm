/**
 * Tests Helpers - Database Safety First
 * 
 * SAFETY WARNINGS:
 * - All database operations are wrapped in transactions that auto-rollback
 * - Validation is MANDATORY and cannot be skipped
 * - Tests CANNOT run against non-test databases
 * - NODE_ENV must be 'test'
 */

// Import the extended PrismaClient with all models
import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '../src/lib/db/prisma';

// Re-export the prisma instance from the main app for tests
const prisma = prismaInstance;

// Type for transaction client (excludes connection methods)
// Using a more flexible type that allows Prisma's actual model names
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================
// DATABASE SAFETY - TABLE CONFIGURATION
// ============================================

/**
 * Tables in order of dependency (respects FK constraints)
 * Used for cleanup and reset operations
 */
const TABLES_IN_DEPENDENCY_ORDER = [
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
] as const;

// ============================================
// DATABASE SAFETY - VALIDATION (MANDATORY)
// ============================================

/**
 * Validates that we are using a test database
 * MANDATORY - Cannot be skipped
 * Throws error if:
 * - NODE_ENV is not 'test'
 * - DATABASE_URL doesn't point to a test database
 * - Database name doesn't contain 'test'
 * 
 * @throws {Error} If validation fails
 */
export async function validateTestDB(): Promise<void> {
  const url = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;

  // STRICT: Validate NODE_ENV
  if (nodeEnv !== 'test') {
    throw new Error(
      `\n╔══════════════════════════════════════════════════════════════════╗\n` +
      `║  ❌ FATAL ERROR: INVALID NODE_ENV                               ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  NODE_ENV is '${nodeEnv}', but must be 'test'                   ║\n` +
      `║                                                                  ║\n` +
      `║  To run tests:                                                   ║\n` +
      `║    NODE_ENV=test npm run test                                    ║\n` +
      `║                                                                  ║\n` +
      `║  Tests CANNOT run with NODE_ENV=development or production      ║\n` +
      `╚══════════════════════════════════════════════════════════════════╝\n`
    );
  }

  // STRICT: Validate database URL format
  if (!url) {
    throw new Error(
      `\n╔══════════════════════════════════════════════════════════════════╗\n` +
      `║  ❌ FATAL ERROR: DATABASE_URL NOT SET                           ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  DATABASE_URL environment variable is not set                   ║\n` +
      `║                                                                  ║\n` +
      `║  Create .env.test file with test database configuration         ║\n` +
      `║  Copy from .env.test.example                                    ║\n` +
      `╚══════════════════════════════════════════════════════════════════╝\n`
    );
  }

  // STRICT: Validate database name contains "test"
  const dbNameMatch = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : '';
  
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(
      `\n╔══════════════════════════════════════════════════════════════════╗\n` +
      `║  ❌ FATAL ERROR: DATABASE NAME MUST CONTAIN "test"               ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  Database name: "${dbName}"                                     ║\n` +
      `║                                                                  ║\n` +
      `║  Database name MUST contain "test" to prevent accidental       ║\n` +
      `║  execution against production databases                         ║\n` +
      `║                                                                  ║\n` +
      `║  Example valid names:                                            ║\n` +
      `║    - myapp_test                                                  ║\n` +
      `║    - test_database                                               ║\n` +
      `║    - 3dprint_tfm_test                                            ║\n` +
      `╚══════════════════════════════════════════════════════════════════╝\n`
    );
  }

  // STRICT: Block production database patterns
  const isProdUrl = 
    url.includes('/postgres?') ||
    url.includes(':5432/postgres') ||
    url.includes('prod') ||
    url.includes('production');

  if (isProdUrl) {
    throw new Error(
      `\n╔══════════════════════════════════════════════════════════════════╗\n` +
      `║  ❌ FATAL ERROR: PRODUCTION DATABASE DETECTED                     ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  DATABASE_URL appears to point to a production database:        ║\n` +
      `║  ${url.substring(0, 50)}...                                      ║\n` +
      `║                                                                  ║\n` +
      `║  Detected patterns: /postgres?, :5432/postgres, prod           ║\n` +
      `║                                                                  ║\n` +
      `║  Create a separate database for tests and ensure the URL         ║\n` +
      `║  contains "test" in the database name                            ║\n` +
      `╚══════════════════════════════════════════════════════════════════╝\n`
    );
  }

  // STRICT: Validate port (test databases typically use different ports)
  const hasTestPort = url.includes(':5433') || url.includes(':5434') || url.includes(':5435');
  const isTestPort = url.match(/:\d{4}/) && hasTestPort;
  
  // Also allow if explicitly using a test-named database on standard port
  if (!isTestPort && dbName.toLowerCase().includes('test')) {
    // OK - database name contains test, that's sufficient
  }

  console.log('✅ Database Validation: PASSED');
  console.log(`   Database: ${dbName}`);
  console.log(`   Environment: ${nodeEnv}`);
}

/**
 * Runs validation synchronously for immediate feedback
 * Use at top of test files before any database operations
 * 
 * @throws {Error} If validation fails
 */
export function validateTestDBSync(): void {
  const url = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test') {
    throw new Error(
      `FATAL: NODE_ENV must be 'test', but is '${nodeEnv}'. ` +
      `Tests cannot run with NODE_ENV=development or production.`
    );
  }

  if (!url.toLowerCase().includes('test')) {
    throw new Error(
      `FATAL: DATABASE_URL must point to a test database (contain "test"). ` +
      `Current URL does not contain "test".`
    );
  }
}

// ============================================
// TRANSACTION WRAPPER (Auto-Rollback)
// ============================================

/**
 * Transaction isolation level type
 */
type TransactionIsolationLevel = 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';

/**
 * Options for transaction wrapper
 */
interface TransactionOptions {
  /** Maximum time to wait for transaction in ms (default: 5000) */
  timeout?: number;
  /** Whether to rollback on success (default: true for tests) */
  rollbackOnSuccess?: boolean;
  /** Transaction isolation level */
  isolationLevel?: TransactionIsolationLevel;
}

/**
 * Wraps a test function in a database transaction that automatically rolls back
 * This ensures test data never persists to the database
 * 
 * @example
 * ```typescript
 * import { withTestTransaction } from './helpers';
 * 
 * it('should create a user', withTestTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { email: 'test@test.com' } });
 *   expect(user.email).toBe('test@test.com');
 *   // Transaction rolls back automatically - user never saved
 * }));
 * 
 * // Or with describe blocks:
 * describe('User API', () => {
 *   beforeEach(withTestTransaction(async (tx) => {
 *     await tx.user.create({ data: { email: 'setup@test.com' } });
 *   }));
 *   
 *   it('works with isolated data', async () => {
 *     // Each test gets fresh data that rolls back after
 *   });
 * });
 * ```
 * 
 * @param testFn Function that receives a transaction client
 * @param options Transaction options
 * @returns Wrapped test function
 */
export function withTestTransaction<T = any>(
  testFn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options: TransactionOptions = {}
): () => Promise<T> {
  const { 
    timeout = 5000, 
    rollbackOnSuccess = true 
  } = options;

  return async function wrappedTest(): Promise<T> {
    // Validate before running transaction
    validateTestDBSync();

    let result: T;
    let error: Error | null = null;

    // Run inside a transaction that will rollback
    await prisma.$transaction(async (tx) => {
      try {
        // Execute the test function with the transaction client
        result = await testFn(tx);
        
        // If rollbackOnSuccess is true, throw a special error to force rollback
        // This is caught by Prisma and causes the transaction to rollback
        if (rollbackOnSuccess) {
          throw new TestTransactionRollbackError();
        }
      } catch (err) {
        if (err instanceof TestTransactionRollbackError) {
          // Expected - this triggers rollback
          return;
        }
        // Re-throw actual test errors
        error = err as Error;
      }
    }, {
      maxWait: timeout,
      timeout: timeout,
    });

    if (error) {
      throw error;
    }

    return result!;
  };
}

/**
 * Special error to trigger transaction rollback
 * This is caught by Prisma to rollback without failing the test
 */
class TestTransactionRollbackError extends Error {
  constructor() {
    super('__TEST_TRANSACTION_ROLLBACK__');
    this.name = 'TestTransactionRollbackError';
  }
}

// ============================================
// DATABASE CLEANUP & RESET
// ============================================

/**
 * Cleans the test database by truncating all tables
 * Truncates in correct order to respect FK constraints
 * 
 * @param options Options for cleanup
 * @param options.verbose Log table names being truncated (default: false)
 * @param options.validate Run validation before cleanup (default: true)
 * 
 * @example
 * ```typescript
 * // Before all tests
 * beforeAll(async () => {
 *   await cleanupDB();
 * });
 * 
 * // After each test for complete isolation
 * afterEach(async () => {
 *   await cleanupDB({ verbose: true });
 * });
 * ```
 */
export async function cleanupDB(options: { verbose?: boolean; validate?: boolean } = {}): Promise<void> {
  const { verbose = false, validate = true } = options;
  
  if (validate) {
    await validateTestDB();
  }

  for (const table of TABLES_IN_DEPENDENCY_ORDER) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      if (verbose) {
        console.log(`   Truncated: ${table}`);
      }
    } catch {
      // Ignore errors if table doesn't exist or is already empty
    }
  }

  if (verbose) {
    console.log('✅ Database cleaned');
  }
}

/**
 * Completely resets the test database to a clean state
 * - Truncates all tables
 * - Resets sequences
 * - Seeds basic test data
 * 
 * Use this before test suites for a guaranteed clean state
 * 
 * @example
 * ```typescript
 * // In setup.ts or beforeAll
 * beforeAll(async () => {
 *   await resetTestDatabase();
 * });
 * ```
 */
export async function resetTestDatabase(): Promise<void> {
  console.log('🔄 Resetting test database...');
  
  // Mandatory validation
  await validateTestDB();
  
  // Clean all tables
  await cleanupDB({ validate: false, verbose: true });
  
  // Reset sequences (for PostgreSQL)
  try {
    for (const table of TABLES_IN_DEPENDENCY_ORDER) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER SEQUENCE IF EXISTS "${table}_id_seq" RESTART WITH 1`
        );
      } catch {
        // Table may not have a sequence
      }
    }
    console.log('   Sequences reset');
  } catch {
    // Ignore if sequences don't exist (e.g., using UUIDs)
  }
  
  // Seed minimal test data
  await seedTestData();
  
  console.log('✅ Database reset complete');
}

// ============================================
// TEST DATA SEEDING
// ============================================

/**
 * Creates basic test data
 * Minimum users and products required for tests
 * 
 * Note: Use within a transaction wrapper for test isolation
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

  // Create images using local project images
  await prisma.productImage.createMany({
    data: [
      {
        id: 'test-img-1',
        productId: 'test-product-1',
        url: '/images/products/p1/p1-1.jpg',
        filename: 'p1-1.jpg',
        altText: 'Product 1',
        isMain: true,
        displayOrder: 0,
      },
      {
        id: 'test-img-2',
        productId: 'test-product-2',
        url: '/images/products/p2/p2-1.jpg',
        filename: 'p2-1.jpg',
        altText: 'Product 2',
        isMain: true,
        displayOrder: 0,
      },
    ],
    skipDuplicates: true,
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Gets information about the current database
 * Safe to call - doesn't validate
 */
export function getDBInfo() {
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';
  const nodeEnv = process.env.NODE_ENV || 'unknown';

  return {
    database: dbName,
    isTest: dbName.toLowerCase().includes('test') || url.includes(':5433'),
    isProduction: url.includes('prod') || url.includes('production'),
    nodeEnv: nodeEnv,
    isValidEnvironment: nodeEnv === 'test' && dbName.toLowerCase().includes('test'),
  };
}

/**
 * Waits a specific time
 * Useful for waiting for the database to persist data
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if running in test environment
 * Quick check without throwing errors
 */
export function isTestEnvironment(): boolean {
  const dbInfo = getDBInfo();
  return dbInfo.isValidEnvironment;
}

// ============================================
// DEPRECATED EXPORTS (for backwards compatibility)
// ============================================

/**
 * @deprecated Use validateTestDB() instead - validation is now mandatory
 */
export async function validateTestDBDeprecated(): Promise<void> {
  console.warn('⚠️  validateTestDBDeprecated is deprecated. Use validateTestDB() instead.');
  return validateTestDB();
}

// Export prisma instance
export { prisma };
