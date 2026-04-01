/**
 * Helpers para limpieza de base de datos en tests
 * IMPORTANTE: Solo eliminar datos creados por tests, NO datos del seed
 */
import { prisma } from '@/lib/db/prisma';

/**
 * Limpia SOLO los usuarios creados por tests (emails que empiezan con 'test-')
 * NO elimina usuarios del seed (@example.com sin prefijo test-)
 */
export async function cleanupTestUsers() {
  // Solo eliminar usuarios con prefijo 'test-' que son creados por tests
  // NO eliminar juan@example.com, maria@example.com, etc. del seed
  await prisma.usuario.deleteMany({
    where: {
      email: {
        startsWith: 'test-', // Solo emails que empiezan con 'test-'
      },
    },
  });
}

/**
 * Limpia SOLO pedidos de usuarios de test
 * NO afecta pedidos del seed
 */
export async function cleanupTestPedidos() {
  // Encontrar usuarios de test
  const usuariosTest = await prisma.usuario.findMany({
    where: {
      email: {
        startsWith: 'test-',
      },
    },
    select: { id: true },
  });

  const ids = usuariosTest.map((u: { id: string }) => u.id);

  if (ids.length > 0) {
    await prisma.pedido.deleteMany({
      where: {
        usuarioId: {
          in: ids,
        },
      },
    });
  }
}

/**
 * Limpia productos de test (con ID TEST- o nombre que contiene TEST)
 */
export async function cleanupTestProducts() {
  await prisma.producto.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'TEST-' } },
        { nombre: { contains: 'TEST' } },
      ],
    },
  });
}

/**
 * Limpieza completa de datos de test
 * Solo afecta a datos creados por tests, no al seed
 */
export async function cleanupTestData() {
  // 1. Eliminar pedidos de usuarios de test primero
  await cleanupTestPedidos();

  // 2. Eliminar usuarios de test
  await cleanupTestUsers();

  // 3. Eliminar productos de test
  await cleanupTestProducts();
}

/**
 * Verifica si hay usuarios de test (con prefijo 'test-')
 */
export async function hasTestData(): Promise<boolean> {
  const testUsers = await prisma.usuario.count({
    where: {
      email: {
        startsWith: 'test-',
      },
    },
  });

  return testUsers > 0;
}
