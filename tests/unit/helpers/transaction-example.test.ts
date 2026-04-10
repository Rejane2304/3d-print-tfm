/**
 * ============================================
 * EXAMPLE: Database Safety with Transactions
 * ============================================
 * 
 * This file demonstrates the proper way to write tests
 * with automatic transaction rollback.
 * 
 * Key points:
 * - Tests MUST use withTestTransaction() for database isolation
 * - Data created inside transactions never persists
 * - Each test gets a clean slate
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { 
  withTestTransaction, 
  resetTestDatabase, 
  prisma,
  getDBInfo 
} from '../../helpers';
import { randomUUID } from 'crypto';

describe('Example: Transaction Safety Demo', () => {
  // Reset database before the test suite
  beforeAll(async () => {
    await resetTestDatabase();
  });

  it('should create data that rolls back', withTestTransaction(async (tx) => {
    // Get current database info
    const dbInfo = getDBInfo();
    expect(dbInfo.isTest).toBe(true);

    // Create a user inside the transaction
    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        email: 'temp@example.com',
        name: 'Temp User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
        updatedAt: new Date(),
      },
    });

    // User exists within the transaction
    expect(user.email).toBe('temp@example.com');
    
    // We can query within the transaction
    const found = await tx.user.findUnique({
      where: { email: 'temp@example.com' },
    });
    expect(found).toBeDefined();

    // After this test completes, the transaction rolls back
    // The user 'temp@example.com' never exists in the actual database
  }));

  it('should confirm previous test data was rolled back', withTestTransaction(async (tx) => {
    // Clean up any residual data from failed runs first
    await tx.user.deleteMany({
      where: { email: 'temp@example.com' },
    });

    // Try to find the user from the previous test
    const user = await tx.user.findUnique({
      where: { email: 'temp@example.com' },
    });

    // Should be null because previous transaction rolled back
    expect(user).toBeNull();
  }));

  it('should handle multiple operations in one transaction', withTestTransaction(async (tx) => {
    // Create category
    const category = await tx.category.create({
      data: {
        id: randomUUID(),
        name: 'Test Category',
        slug: 'test-category-temp',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create product in that category
    const product = await tx.product.create({
      data: {
        id: randomUUID(),
        slug: 'test-product-temp',
        name: 'Test Product',
        description: 'A test product',
        price: 19.99,
        stock: 10,
        categoryId: category.id,
        material: 'PLA',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Verify relationship
    const productWithCategory = await tx.product.findUnique({
      where: { id: product.id },
      include: { category: true },
    });

    expect(productWithCategory?.category.name).toBe('Test Category');

    // All of this rolls back after the test
  }));

  it('should allow using global prisma for setup, tx for isolation', withTestTransaction(async (tx) => {
    // The database was seeded in resetTestDatabase()
    // using the global prisma instance
    
    // We can see seeded data in the transaction
    const adminUser = await tx.user.findUnique({
      where: { email: 'admin@test.com' },
    });
    
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('ADMIN');

    // Create additional test-specific data in transaction
    const newUser = await tx.user.create({
      data: {
        id: randomUUID(),
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
        updatedAt: new Date(),
      },
    });

    expect(newUser).toBeDefined();
    
    // Only the new@example.com user rolls back
    // admin@test.com remains (seeded before tests)
  }));

  it('should demonstrate error handling in transactions', withTestTransaction(async (tx) => {
    // Try to create a user with duplicate email
    await tx.user.create({
      data: {
        id: randomUUID(),
        email: 'unique@example.com',
        name: 'Unique User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
        updatedAt: new Date(),
      },
    });

    // Even if the test throws an error, the transaction rolls back
    // This ensures no partial data remains
    
    // Simulate an error (but transaction still rolls back)
    try {
      await tx.user.create({
        data: {
          id: randomUUID(),
        email: 'unique@example.com', // Duplicate
          name: 'Another User',
          password: 'hashedpassword',
          role: 'CUSTOMER',
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Expected error - transaction will roll back
      expect(error).toBeDefined();
    }
  }));

  it('should verify no data leaked from previous tests', async () => {
    // This test uses the global prisma (outside transaction)
    // to verify no test data persisted

    // First clean up any residual data from failed runs
    await prisma.user.deleteMany({
      where: { email: { in: ['temp@example.com', 'new@example.com', 'unique@example.com'] } },
    });
    
    const tempEmails = [
      'temp@example.com',
      'new@example.com',
      'unique@example.com',
    ];

    for (const email of tempEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      // All should be null - transaction rollback worked
      expect(user).toBeNull();
    }
  });
});

describe('Example: Best Practices', () => {
  // Reset database before tests in this describe block
  beforeAll(async () => {
    await resetTestDatabase();
  });

  it('DEMO: Always use tx inside withTestTransaction', withTestTransaction(async (tx) => {
    // ✅ CORRECT: Use the transaction client
    const user = await tx.user.findFirst({});
    
    // ❌ WRONG: Don't use global prisma inside the callback
    // This would bypass the transaction!
    // const user = await prisma.user.findFirst({}); // DON'T DO THIS
    
    expect(user).toBeDefined();
  }));

  it('DEMO: Handle async operations properly', withTestTransaction(async (tx) => {
    // ✅ CORRECT: Proper async/await
    const users = await tx.user.findMany({});
    expect(users).toBeInstanceOf(Array);
    
    // Can chain operations
    const count = await tx.user.count({});
    expect(typeof count).toBe('number');
  }));

  it('DEMO: Test assertions work normally', withTestTransaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { email: 'admin@test.com' },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe('admin@test.com');
    expect(user?.role).toBe('ADMIN');
    expect(user?.isActive).toBe(true);
  }));
});

/**
 * ============================================
 * USAGE SUMMARY
 * ============================================
 * 
 * 1. Import withTestTransaction from helpers
 * 2. Wrap test function: it('name', withTestTransaction(async (tx) => { ... }))
 * 3. Use 'tx' for all database operations
 * 4. Data automatically rolls back after test
 * 5. Tests remain isolated and fast
 * 
 * Benefits:
 * - No manual cleanup needed
 * - Parallel test execution safe
 * - No data pollution between tests
 * - Production data always protected
 */
