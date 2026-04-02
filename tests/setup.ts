/**
 * Setup para tests de Vitest
 * Configuración del entorno de pruebas con PostgreSQL
 * 
 * ⚠️  IMPORTANTE: Este archivo ejecuta operaciones destructivas (TRUNCATE)
 *     sobre la base de datos. Está configurado para ejecutarse SOLO contra
 *     una BD aislada de tests, NUNCA contra la BD de desarrollo/producción.
 */
import { vi, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { prisma } from '@/lib/db/prisma';
import { validateTestDatabaseIsolation } from './helpers/db-validation';

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

/**
 * Limpia la base de datos de test
 * Orden específico para respetar foreign keys
 * 
 * ⚠️  CRÍTICO: Esta función ejecuta TRUNCATE que borra TODOS los datos.
 *     SOLO debe ejecutarse en una BD aislada de tests.
 *     Está protegida por validateTestDatabaseIsolation()
 */
async function limpiarBaseDeDatos() {
  const tablas = [
    'logs_auditoria',
    'tokens_verificacion',
    'sesiones',
    'mensajes_pedido',
    'alertas',
    'movimientos_inventario',
    'pagos',
    'items_pedido',
    'items_carrito',
    'carritos',
    'pedidos',
    'facturas',
    'imagenes_producto',
    'productos',
    'direcciones',
    'usuarios',
    'configuracion_envios',
    'configuracion',
  ];

  // Validación de seguridad extra: nunca truncar sin validación
  await validateTestDatabaseIsolation();

  for (const tabla of tablas) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tabla}" CASCADE`);
    } catch (error) {
      // Ignorar errores si la tabla no existe o está vacía
      // console.log(`⚠️  Tabla ${tabla}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }
}

/**
 * Inserta datos iniciales necesarios para tests
 */
async function seedDatosIniciales() {
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('test123', 10);

  await prisma.usuario.createMany({
    data: [
      {
        id: 'test-admin-id',
        email: 'admin@test.com',
        nombre: 'Admin Test',
        password: passwordHash,
        rol: 'ADMIN',
        activo: true,
      },
      {
        id: 'test-client-id',
        email: 'cliente@test.com',
        nombre: 'Cliente Test',
        password: passwordHash,
        rol: 'CLIENTE',
        activo: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.producto.createMany({
    data: [
      {
        id: 'test-product-1',
        slug: 'test-product-1',
        nombre: 'Producto Test 1',
        descripcion: 'Descripción del producto de test',
        precio: 19.99,
        stock: 10,
        categoria: 'DECORACION',
        material: 'PLA',
        activo: true,
      },
      {
        id: 'test-product-2',
        slug: 'test-product-2',
        nombre: 'Producto Test 2',
        descripcion: 'Otro producto de test',
        precio: 29.99,
        stock: 5,
        categoria: 'ACCESORIOS',
        material: 'PETG',
        activo: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.imagenProducto.createMany({
    data: [
      {
        id: 'test-img-1',
        productoId: 'test-product-1',
        url: 'https://example.com/img1.jpg',
        nombreArchivo: 'img1.jpg',
        textoAlt: 'Producto 1',
        esPrincipal: true,
        orden: 0,
      },
      {
        id: 'test-img-2',
        productoId: 'test-product-2',
        url: 'https://example.com/img2.jpg',
        nombreArchivo: 'img2.jpg',
        textoAlt: 'Producto 2',
        esPrincipal: true,
        orden: 0,
      },
    ],
    skipDuplicates: true,
  });
}

// Flag para asegurar que solo se ejecuta una vez
let dbSetupDone = false;

// Setup para tests de integración
beforeAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    // Skip DB setup if SKIP_DB_TESTS is set
    if (process.env.SKIP_DB_TESTS === 'true') {
      console.log('⏭️  Saltando configuración de base de datos (SKIP_DB_TESTS=true)');
      return;
    }
    
    // Solo ejecutar una vez
    if (dbSetupDone) {
      return;
    }
    dbSetupDone = true;
    
    console.log('🧪 Configurando base de datos de test (PostgreSQL)...');
    try {
      // Limpiar base de datos
      await limpiarBaseDeDatos();
      
      // Insertar datos iniciales
      await seedDatosIniciales();
      
      // Verificar que hay datos
      const usuariosCount = await prisma.usuario.count();
      const productosCount = await prisma.producto.count();
      
      if (usuariosCount === 0 || productosCount === 0) {
        console.log(`⚠️  Datos insuficientes: ${usuariosCount} usuarios, ${productosCount} productos`);
      }
      
      console.log('✅ BD de test lista');
    } catch (error) {
      console.error('❌ Error configurando BD:', error);
      console.log('⚠️  Continuando sin base de datos...');
      // Don't throw - let tests continue
    }
  }
});

// Limpieza después de todos los tests
afterAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    if (process.env.SKIP_DB_TESTS === 'true') {
      return;
    }
    
    console.log('🧹 Limpiando base de datos de test...');
    try {
      await limpiarBaseDeDatos();
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
});
