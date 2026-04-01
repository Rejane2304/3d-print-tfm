/**
 * Setup para tests de Vitest
 * Configuración del entorno de pruebas con SQLite en memoria
 */
import { vi, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { execSync } from 'child_process';
import { prisma } from '@/lib/db/prisma';

// Configurar variables de entorno para tests
process.env.DATABASE_URL = 'file:./test.db';

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

// Configuración global
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

// Setup para tests de integración
beforeAll(async () => {
  // Inicializar BD de test si es necesario
  if (process.env.VITEST_ENV === 'integration') {
    console.log('🧪 Configurando base de datos de test...');
    try {
      // Limpiar datos existentes
      await prisma.$executeRaw`DELETE FROM usuarios WHERE email LIKE 'test-%'`;
      console.log('✅ BD de test lista');
    } catch (error) {
      console.error('❌ Error configurando BD:', error);
    }
  }
});

// Limpieza después de todos los tests
afterAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    console.log('🧹 Limpiando base de datos de test...');
    try {
      await prisma.$executeRaw`DELETE FROM usuarios WHERE email LIKE 'test-%'`;
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }
  await prisma.$disconnect();
});
