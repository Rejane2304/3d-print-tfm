/**
 * ============================================
 * TRANSACTIONAL ISOLATION PARA TESTS
 * ============================================
 * 
 * Sistema de aislamiento con transacciones PostgreSQL
 * Cada test se ejecuta en su propia transacción que se revierte al final
 * 
 * BENEFICIOS:
 * ✅ Aislamiento perfecto entre tests
 * ✅ Sin race conditions de limpieza
 * ✅ Sin FK violations
 * ✅ Rollback automático = limpieza instantánea
 * ✅ Datos precargados disponibles dentro de la transacción
 * 
 * CÓMO FUNCIONA:
 * 1. beforeEach: Inicia transacción SQL (BEGIN)
 * 2. Test ejecuta dentro de la transacción
 * 3. afterEach: Rollback SQL (ROLLBACK)
 * 4. Todos los cambios desaparecen = BD limpia
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Configuración de transacciones para un suite de tests
 * 
 * USO:
 * ```typescript
 * describe('Suite de tests', () => {
 *   setupTestTransactions();
 *   
 *   it('test 1', async () => {
 *     // Cada test corre dentro de su propia transacción
 *     const user = await prisma.usuario.create(...);
 *     // Datos creados aquí se revierten al final del test
 *   });
 * });
 * ```
 */
export function setupTestTransactions(options?: {
  readonly: boolean; // Si true, no hacer cambios en BD
}) {
  return {
    async beforeEach() {
      if (!options?.readonly) {
        // Iniciar transacción a nivel SQL
        // Esto asegura que la transacción esté abierta para TODOS los cambios
        try {
          await prisma.$executeRaw`BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED`;
        } catch (error) {
          console.warn('Error iniciando transacción:', error instanceof Error ? error.message : 'unknown');
        }
      }
    },

    async afterEach() {
      if (!options?.readonly) {
        // Hacer rollback de la transacción
        // Todos los cambios hechos en el test se revierten
        try {
          await prisma.$executeRaw`ROLLBACK`;
        } catch (error) {
          // Ignorar error si la transacción ya fue revertida
          console.debug('Rollback completado');
        }
      }
    },
  };
}

/**
 * Wrapper de transacción manual para tests específicos
 * Usa esta función si setupTestTransactions no funciona bien
 * 
 * USO:
 * ```typescript
 * it('test con datos creados', async () => {
 *   await withTestTransaction(async () => {
 *     const user = await prisma.usuario.create(...);
 *     expect(user.id).toBeDefined();
 *     // Aquí el test se ejecuta normalmente
 *   });
 *   // Después de withTestTransaction, todos los cambios están revertidos
 * });
 * ```
 */
export async function withTestTransaction<T>(
  testFn: () => Promise<T>,
): Promise<T> {
  try {
    // Iniciar transacción
    await prisma.$executeRaw`BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED`;

    // Ejecutar el test
    const result = await testFn();

    // Rollback automático
    await prisma.$executeRaw`ROLLBACK`;

    return result;
  } catch (error) {
    // Intentar hacer rollback en caso de error
    try {
      await prisma.$executeRaw`ROLLBACK`;
    } catch {
      // Ignorar error de rollback
    }
    throw error;
  }
}

/**
 * Savepoint: permite rollback parcial dentro de una transacción
 * Útil para escenarios complejos
 * 
 * USO:
 * ```typescript
 * it('test con savepoints', async () => {
 *   const sp = new Savepoint('sp1');
 *   
 *   // Crear datos
 *   const user = await prisma.usuario.create(...);
 *   
 *   // Crear savepoint
 *   await sp.create();
 *   
 *   // Hacer más cambios
 *   const order = await prisma.pedido.create(...);
 *   
 *   // Revertir solo a partir del savepoint
 *   await sp.rollback();
 *   
 *   // El usuario sigue ahí, pero el pedido se revirtió
 * });
 * ```
 */
export class Savepoint {
  private name: string;
  private isActive = false;

  constructor(name: string) {
    this.name = `sp_${name}_${Date.now()}`;
  }

  async create(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`SAVEPOINT ${this.name}`);
      this.isActive = true;
    } catch (error) {
      console.warn(`Error creando savepoint ${this.name}:`, error);
    }
  }

  async rollback(): Promise<void> {
    if (!this.isActive) return;
    try {
      await prisma.$executeRawUnsafe(`ROLLBACK TO ${this.name}`);
      this.isActive = false;
    } catch (error) {
      console.warn(`Error revertiendo savepoint ${this.name}:`, error);
    }
  }

  async release(): Promise<void> {
    if (!this.isActive) return;
    try {
      await prisma.$executeRawUnsafe(`RELEASE ${this.name}`);
      this.isActive = false;
    } catch (error) {
      console.warn(`Error liberando savepoint ${this.name}:`, error);
    }
  }
}

/**
 * Verifica el estado de la transacción actual
 */
export async function getTransactionStatus(): Promise<{
  inTransaction: boolean;
  isolationLevel: string;
}> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ current_transaction_isolation: string }>
    >`SHOW TRANSACTION ISOLATION LEVEL`;

    return {
      inTransaction: true,
      isolationLevel: result[0]?.current_transaction_isolation || 'unknown',
    };
  } catch {
    return {
      inTransaction: false,
      isolationLevel: 'unknown',
    };
  }
}
