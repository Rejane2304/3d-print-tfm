/**
 * Setup para tests de Vitest
 * Configuración del entorno de pruebas con PostgreSQL
 */
import { vi, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { prisma } from '@/lib/db/prisma';

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

/**
 * Limpia la base de datos de test
 * Orden específico para respetar foreign keys
 */
async function limpiarBaseDeDatos() {
  const tablas = [
    'LogAuditoria',
    'VerificationToken',
    'Session',
    'MensajePedido',
    'Alerta',
    'MovimientoInventario',
    'Pago',
    'ItemPedido',
    'Pedido',
    'Factura',
    'ImagenProducto',
    'Producto',
    'Direccion',
    'Usuario',
    'ConfiguracionEnvio',
    'Configuracion',
  ];

  for (const tabla of tablas) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tabla}" CASCADE`);
    } catch (error) {
      // Ignorar errores si la tabla no existe o está vacía
      console.log(`⚠️  Tabla ${tabla}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }
}

/**
 * Inserta datos iniciales necesarios para tests
 * Nota: Cada test debe crear sus propios datos
 */
async function seedDatosIniciales() {
  // Los tests deben ser independientes y crear sus propios datos
  // No insertamos datos aquí para evitar dependencias
}

// Setup para tests de integración
beforeAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    console.log('🧪 Configurando base de datos de test (PostgreSQL)...');
    try {
      // Limpiar base de datos
      await limpiarBaseDeDatos();
      
      // Insertar datos iniciales
      await seedDatosIniciales();
      
      console.log('✅ BD de test lista');
    } catch (error) {
      console.error('❌ Error configurando BD:', error);
      throw error;
    }
  }
});

// Limpieza después de todos los tests
afterAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    console.log('🧹 Limpiando base de datos de test...');
    try {
      await limpiarBaseDeDatos();
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }
  await prisma.$disconnect();
});
