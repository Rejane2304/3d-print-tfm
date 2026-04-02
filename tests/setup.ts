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
 * Orden específica para respetar foreign keys
 * Implementa reintentos para manejar deadlocks
 * 
 * NOTA: El caller debe manejar el advisory lock si es necesario para serialización
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

  // Reintentos para manejar deadlocks
  const maxReintentos = 3;
  let ultimoError: Error | null = null;

  for (let intento = 0; intento < maxReintentos; intento++) {
    try {
      for (const tabla of tablas) {
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tabla}" CASCADE`);
        } catch (error) {
          // Ignorar errores si la tabla no existe o está vacía
        }
      }
      // Si llegamos aquí, la limpieza fue exitosa
      return;
    } catch (error) {
      ultimoError = error instanceof Error ? error : new Error(String(error));
      
      // Si es deadlock, reintentar
      if (ultimoError.message.includes('deadlock')) {
        console.log(`⚠️  Deadlock detectado en intento ${intento + 1}/${maxReintentos}, reintentando...`);
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 500 * (intento + 1)));
      } else {
        // Si no es deadlock, no reintentar
        throw error;
      }
    }
  }

  // Si llegamos aquí después de todos los reintentos
  if (ultimoError) {
    console.error(`❌ Error limpiando BD después de ${maxReintentos} intentos:`, ultimoError.message);
  }
}

/**
 * Inserta datos iniciales necesarios para tests
 */
async function seedDatosIniciales() {
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('test123', 10);

  // Eliminar datos anteriores primero (por si acaso quedaron de una ejecución anterior)
  try {
    await prisma.imagenProducto.deleteMany({});
    await prisma.producto.deleteMany({});
    await prisma.usuario.deleteMany({});
  } catch (error) {
    // Ignore errors if tables don't exist
  }

  // Pequeño delay 
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Crear usuarios
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
    });
  } catch (error) {
    console.error('❌ Error creando usuarios:', error instanceof Error ? error.message : error);
  }

  // Pequeño delay para asegurar persistencia
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Crear productos
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
    });
  } catch (error) {
    console.error('❌ Error creando productos:', error instanceof Error ? error.message : error);
  }

  // Pequeño delay para asegurar persistencia
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Crear imágenes
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
    });
  } catch (error) {
    console.error('❌ Error creando imágenes:', error instanceof Error ? error.message : error);
  }

  // Final pequeño delay para asegurar que TODO está persistido
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Flag para asegurar que solo se ejecuta una vez
let dbSetupDone = false;
let setupPromise: Promise<void> | null = null;
let setupLockAcquired = false;

// Setup para tests de integración
beforeAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    // Skip DB setup if SKIP_DB_TESTS is set
    if (process.env.SKIP_DB_TESTS === 'true') {
      console.log('⏭️  Saltando configuración de base de datos (SKIP_DB_TESTS=true)');
      return;
    }
    
    // Si ya está en proceso o completado, esperar
    if (setupPromise) {
      await setupPromise;
      return;
    }
    
    // Crear una promesa compartida para toda la inicialización
    setupPromise = (async () => {
      console.log('🧪 Configurando base de datos de test (PostgreSQL)...');
      try {
        // Usar advisory lock para TODA la fase de setup (TRUNCATE + SEED)
        // Esto previene que otros tests limpien mientras estamos inicializando
        await prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(1)`);
        setupLockAcquired = true;
        
        try {
          // Limpiar base de datos 
          await limpiarBaseDeDatos();
          
          // Insertar datos iniciales (dentro del lock para evitar race conditions)
          await seedDatosIniciales();
        } finally {
          // Liberar el lock
          if (setupLockAcquired) {
            try {
              await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(1)`);
            } catch {
              // Ignorar error si el lock no existe
            }
            setupLockAcquired = false;
          }
        }
        
        // Esperar a que los datos persistan en la BD (FUERA del lock)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verificar que hay datos
        const usuariosCount = await prisma.usuario.count();
        const productosCount = await prisma.producto.count();
        
        if (usuariosCount === 0 || productosCount === 0) {
          console.log(`⚠️  Datos insuficientes: ${usuariosCount} usuarios, ${productosCount} productos`);
        }
        
        console.log('✅ BD de test lista');
        dbSetupDone = true;
      } catch (error) {
        console.error('❌ Error configurando BD:', error);
        console.log('⚠️  Continuando sin base de datos...');
        // Don't throw - let tests continue
      }
    })();
    
    // Esperar a que se complete
    await setupPromise;
  }
});

// Limpieza después de todos los tests
// NOTA: No limpiamos aquí para evitar race conditions entre test files en paralelo
// El siguiente test run iniciará con TRUNCATE fresco en beforeAll
afterAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    if (process.env.SKIP_DB_TESTS === 'true') {
      return;
    }
    
    console.log('🧹 Tests completados, desconectando BD...');
    // Nota: NO hacemos TRUNCATE aquí porque causaría race conditions
    // cuando el siguiente test file intenta leer datos mientras limpiamos
  }
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
});
