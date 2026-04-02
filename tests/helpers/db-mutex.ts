/**
 * ============================================
 * FILE-BASED MUTEX FOR SERIALIZED CLEANUP
 * ============================================
 * 
 * Implementa un mutex basado en archivos para garantizar que
 * las operaciones de limpieza de la BD se ejecuten serializadas (una a la vez)
 * 
 * PROBLEMA QUE RESUELVE:
 * - TRUNCATE CASCADE se ejecuta en paralelo con beforeAll blocks
 * - Múltiples tests inicializan datos MIENTRAS se está limpiando
 * - Resulta en FK constraint violations y race conditions
 * 
 * SOLUCIÓN:
 * - Solo un proceso puede ejecutar limpieza a la vez
 * - Los demás procesos esperan con exponential backoff
 * - Garantiza orden serial: TRUNCATE → WAIT → Seed → Tests
 */

import fs from 'fs';
import path from 'path';

/**
 * Path al archivo de lock
 */
const LOCK_FILE = path.join(process.cwd(), '.test-db-lock');

/**
 * Máximo tiempo a esperar por el lock (ms)
 */
const LOCK_TIMEOUT = 60000; // 60 segundos

/**
 * Tiempo base para exponential backoff (ms)
 */
const BACKOFF_BASE = 50;

/**
 * Adquiere el lock con reintentos exponenciales
 */
async function acquireLock(timeoutMs = LOCK_TIMEOUT): Promise<void> {
  const startTime = Date.now();
  let attempt = 0;

  while (true) {
    try {
      // Intentar crear archivo atomicamente (si no existe)
      // fs.openSync con flags 'wx' es atomic y falla si archivo existe
      const fd = fs.openSync(LOCK_FILE, 'wx');
      fs.closeSync(fd);
      // ✅ Lock adquirido exitosamente
      return;
    } catch (error) {
      // Archivo existe, alguien más tiene el lock
      const elapsed = Date.now() - startTime;

      if (elapsed > timeoutMs) {
        // Timeout: liberar lock viejo y tomar el nuevo
        console.warn(
          `⏱️  Lock timeout después de ${elapsed}ms, liberando lock antiguo`
        );
        try {
          fs.unlinkSync(LOCK_FILE);
        } catch {
          // Ignore if file doesn't exist
        }
        // Reintentar una última vez
        try {
          const fd = fs.openSync(LOCK_FILE, 'wx');
          fs.closeSync(fd);
          return;
        } catch {
          throw new Error(
            `No se pudo adquirir lock después de ${elapsed}ms`
          );
        }
      }

      // Exponential backoff con jitter
      const backoffMs = BACKOFF_BASE * Math.pow(1.5, attempt);
      const jitterMs = Math.random() * backoffMs * 0.1; // 10% jitter
      const waitMs = Math.min(backoffMs + jitterMs, 5000); // Max 5s per wait

      // console.log(
      //   `⏳ Lock ocupado, esperando ${Math.round(waitMs)}ms (intento ${attempt + 1})...`
      // );

      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt++;
    }
  }
}

/**
 * Libera el lock (elimina archivo)
 */
function releaseLock(): void {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (error) {
    console.warn('Error liberando lock:', error);
  }
}

/**
 * Ejecuta función con lock exclusivo
 * 
 * USO:
 * ```typescript
 * await withLock(async () => {
 *   // Esta función se ejecuta serializada
 *   // Solo un proceso a la vez puede estar aquí
 *   await limpiarBaseDeDatos();
 * });
 * ```
 */
export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await acquireLock();
  try {
    return await fn();
  } finally {
    releaseLock();
  }
}

/**
 * Fuerza limpieza del lock (usar en caso de emergencia)
 * Llama esto si hay un lock fantasma stuck
 */
export function forceReleaseLock(): void {
  releaseLock();
}

/**
 * Verifica si el lock está actualmente tomado
 */
export function isLocked(): boolean {
  return fs.existsSync(LOCK_FILE);
}
