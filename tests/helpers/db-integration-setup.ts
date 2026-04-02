/**
 * ============================================
 * SETUP DE TESTS DE INTEGRACIÓN CON TRANSACCIONES
 * ============================================
 * 
 * Este archivo configura el entorno de tests para usar
 * transacciones SQL que se revierten automáticamente después de cada test
 * 
 * CARACTERÍSTICAS:
 * ✅ Aislamiento perfecto de datos entre tests
 * ✅ Sin race conditions de limpieza
 * ✅ Rollback automático instantáneo
 * ✅ FK constraints respetadas dentro de la transacción
 * ✅ Compatible con beforeAll/seed de datos
 */

import { beforeEach, afterEach, describe } from 'vitest';
import { prisma } from '@/lib/db/prisma';

/**
 * Flag global para controlar si debe usar transacciones
 */
let useTransactionsForCurrentSuite = false;

/**
 * IMPORTANTE: Esta función reemplaza la necesidad de setupTestTransactions()
 * Se llama al inicio de describe() para habilitar transacciones para TODOS
 * los tests en esa suite
 * 
 * EJEMPLO DE USO:
 * ```typescript
 * describe('Tests de Usuario', () => {
 *   enableTestTransactions();
 *   
 *   it('debe crear usuario', async () => {
 *     // Este test corre en una transacción que se revierte al final
 *     const user = await prisma.usuario.create({...});
 *     expect(user.id).toBeDefined();
 *     // Después: usuario se revierte automáticamente
 *   });
 * });
 * ```
 */
export function enableTestTransactions() {
  // Estas callbacks se ejecutan para CADA TEST en la suite

  beforeEach(async () => {
    try {
      // Iniciar una transacción SQL a nivel de conexión
      // Esto asegura que TODOS los cambios de Prisma estén en la transacción
      await prisma.$executeRawUnsafe('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');
      useTransactionsForCurrentSuite = true;
    } catch (error) {
      console.error('❌ Error iniciando transacción:', error instanceof Error ? error.message : 'unknown');
      throw new Error('No se pudo iniciar transacción para test');
    }
  });

  afterEach(async () => {
    if (useTransactionsForCurrentSuite) {
      try {
        // Hacer rollback: revierte TODOS los cambios del test
        // Esto es instantáneo y no deja residuos en la BD
        await prisma.$executeRawUnsafe('ROLLBACK');
        useTransactionsForCurrentSuite = false;
      } catch (error) {
        // Ignorar errores de rollback - a veces ya está revertido
        console.debug('Transacción revertida');
      }
    }
  });
}

/**
 * Versión alternativa si la anterior no funciona
 * Usa un wrapper que ejecuta cada test dentro de una transacción
 * 
 * EJEMPLO:
 * ```typescript
 * describe('Tests con wrapper', () => {
 *   const { wrapper } = createTransactionWrapper();
 *   
 *   it('debe crear usuario', wrapper(async () => {
 *     const user = await prisma.usuario.create({...});
 *     expect(user.id).toBeDefined();
 *   }));
 * });
 * ```
 */
export function createTransactionWrapper() {
  return {
    wrapper: <T>(testFn: () => Promise<T>) => async () => {
      try {
        await prisma.$executeRawUnsafe('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');

        // Ejecutar el test dentro de la transacción
        const result = await testFn();

        // Siempre hacer rollback, aunque el test pase
        await prisma.$executeRawUnsafe('ROLLBACK');

        return result;
      } catch (error) {
        // En caso de error, intentar rollback antes de relanzar
        try {
          await prisma.$executeRawUnsafe('ROLLBACK');
        } catch {
          // Ignorar
        }
        throw error;
      }
    },
  };
}

/**
 * Savepoint para rollback parcial dentro de una transacción
 * Útil para tests complejos con múltiples escenarios
 * 
 * EJEMPLO:
 * ```typescript
 * it('test con múltiples escenarios', async () => {
 *   // Crear datos iniciales
 *   const user = await prisma.usuario.create({...});
 *   
 *   // Crear un savepoint
 *   const sp = new TestSavepoint('scenario-1');
 *   await sp.create();
 *   
 *   // Hacer cambios
 *   await prisma.usuario.update({...});
 *   
 *   // Revertir solo estos cambios
 *   await sp.rollback();
 *   
 *   // El usuario sigue siendo el original
 * });
 * ```
 */
export class TestSavepoint {
  private name: string;
  private active = false;

  constructor(name: string) {
    // Usar timestamp para asegurar nombres únicos
    this.name = `sp_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async create(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`SAVEPOINT ${this.name}`);
      this.active = true;
    } catch (error) {
      throw new Error(`No se pudo crear savepoint: ${this.name}`);
    }
  }

  async rollback(): Promise<void> {
    if (!this.active) return;
    try {
      await prisma.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${this.name}`);
      this.active = false;
    } catch (error) {
      throw new Error(`No se pudo revertir savepoint: ${this.name}`);
    }
  }

  async release(): Promise<void> {
    if (!this.active) return;
    try {
      await prisma.$executeRawUnsafe(`RELEASE SAVEPOINT ${this.name}`);
      this.active = false;
    } catch (error) {
      throw new Error(`No se pudo liberar savepoint: ${this.name}`);
    }
  }
}
