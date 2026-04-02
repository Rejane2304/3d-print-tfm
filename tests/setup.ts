/**
 * Setup para tests de Vitest
 * Configuración simplificada del entorno de pruebas
 */
import { vi, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { prisma } from '@/lib/db/prisma';
import { cleanupDB, seedTestData, validateTestDB } from './helpers';

// Mock global de next/navigation
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

// Mock de next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children || null,
}));

// Configuración global (solo en ambiente jsdom)
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

// Setup para tests de integración
beforeAll(async () => {
  if (process.env.VITEST_ENV !== 'integration') return;
  if (process.env.SKIP_DB_TESTS === 'true') return;
  
  await validateTestDB();
  await cleanupDB();
  await seedTestData();
  
  console.log('✅ Setup completado');
});

// Cleanup después de todos los tests
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignorar errores de desconexión
  }
});
