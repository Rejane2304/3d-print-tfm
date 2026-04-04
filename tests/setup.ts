/**
 * Setup for Vitest tests
 * Database Safety Configuration
 * 
 * SAFETY FIRST:
 * - Validates test database before any operations
 * - Ensures NODE_ENV=test is set
 * - Prevents accidental execution against production databases
 */
import { vi, afterAll, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { 
  prisma, 
  cleanupDB, 
  seedTestData, 
  validateTestDB,
  resetTestDatabase,
  validateTestDBSync 
} from './helpers';

// CRITICAL: Validate environment before any tests run
// This will throw a fatal error if not properly configured
validateTestDBSync();

// Global mock of next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock of next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children || null,
}));

// Global configuration (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ============================================
// INTEGRATION TEST SETUP
// ============================================

// Setup for integration tests
beforeAll(async () => {
  // Skip if not running integration tests
  if (process.env.VITEST_ENV !== 'integration') return;
  
  // Skip if explicitly disabled
  if (process.env.SKIP_DB_TESTS === 'true') return;
  
  // MANDATORY: Validate database before any operations
  // This will throw if database is not properly configured
  await validateTestDB();
  
  // Reset database to clean state with seeded data
  await resetTestDatabase();
  
  console.log('✅ Setup completed - Database validated and reset');
});

// Cleanup after each integration test to ensure isolation
afterEach(async () => {
  if (process.env.VITEST_ENV !== 'integration') return;
  if (process.env.SKIP_DB_TESTS === 'true') return;
  
  // Clean up data between tests for complete isolation
  // Note: This runs outside transactions for test files that don't use withTestTransaction
  // Tests using withTestTransaction() don't need this as they rollback automatically
  if (process.env.TEST_PERSISTENCE === 'true') {
    await cleanupDB({ validate: false });
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch {
    // Ignore disconnection errors
  }
});
