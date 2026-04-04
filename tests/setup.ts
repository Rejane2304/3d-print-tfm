/**
 * Setup for Vitest tests
 * Simplified test environment configuration
 */
import { vi, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { prisma, cleanupDB, seedTestData, validateTestDB } from './helpers';

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

// Setup for integration tests
beforeAll(async () => {
  if (process.env.VITEST_ENV !== 'integration') return;
  if (process.env.SKIP_DB_TESTS === 'true') return;
  
  await validateTestDB();
  await cleanupDB();
  await seedTestData();
  
  console.log('✅ Setup completed');
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnection errors
  }
});
