/**
 * Tests Helpers - Consolidado
 * 
 * Funciones utilitarias simplificadas para tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Limpia la base de datos de test
 * Trunca todas las tablas en orden correcto para respetar FKs
 */
export async function cleanupDB(): Promise<void> {
  const tables = [
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
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Ignorar errores si tabla no existe o ya está vacía
    }
  }
}

/**
 * Crea datos básicos de test
 * Usuarios y productos mínimos necesarios
 */
export async function seedTestData(): Promise<void> {
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('test123', 10);

  // Crear usuarios de test
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
        email: 'cliente@test.com',
        name: 'Cliente Test',
        password: passwordHash,
        role: 'CUSTOMER',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // Crear productos de test
  await prisma.product.createMany({
    data: [
      {
        id: 'test-product-1',
        slug: 'test-product-1',
        name: 'Producto Test 1',
        description: 'Descripción del producto de test',
        price: 19.99,
        stock: 10,
        category: 'DECORATION',
        material: 'PLA',
        isActive: true,
      },
      {
        id: 'test-product-2',
        slug: 'test-product-2',
        name: 'Producto Test 2',
        description: 'Otro producto de test',
        price: 29.99,
        stock: 5,
        category: 'ACCESSORIES',
        material: 'PETG',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // Crear imágenes
  await prisma.productImage.createMany({
    data: [
      {
        id: 'test-img-1',
        productId: 'test-product-1',
        url: 'https://example.com/img1.jpg',
        filename: 'img1.jpg',
        altText: 'Producto 1',
        isMain: true,
        displayOrder: 0,
      },
      {
        id: 'test-img-2',
        productId: 'test-product-2',
        url: 'https://example.com/img2.jpg',
        filename: 'img2.jpg',
        altText: 'Producto 2',
        isMain: true,
        displayOrder: 0,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * Valida que estamos usando BD de test
 * Lanza error si detecta producción
 */
export async function validateTestDB(): Promise<void> {
  const url = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test') {
    throw new Error(
      `NODE_ENV debe ser 'test', pero es '${nodeEnv}'\n` +
      `Estás intentando ejecutar tests contra BD de ${nodeEnv}!`
    );
  }

  // Detectar BD de producción
  const isProdUrl = 
    url.includes('/postgres?') ||
    url.includes(':5432/postgres') ||
    url.includes('prod') ||
    url.includes('production');

  if (isProdUrl) {
    throw new Error(
      `Detectado intento de ejecutar tests contra BD de PRODUCCIÓN\n` +
      `DATABASE_URL: ${url}\n` +
      `Crea una BD separada para tests`
    );
  }

  if (!url.includes('test') && !url.includes(':5433')) {
    console.warn('⚠️  DATABASE_URL no contiene "test" - ¿estás seguro?');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('✅ Validación de BD: OK');
}

/**
 * Espera un tiempo específico
 * Útil para esperar a que la BD persista datos
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene información de la BD actual
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
