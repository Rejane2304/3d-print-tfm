/**
 * Helper para manejar esperas y reintentos en tests de BD
 * Compensa el delay de persistencia de Prisma/PostgreSQL
 */

/**
 * Espera estándar después de crear datos
 * Asegura que los datos sean visibles en consultas posteriores
 */
export async function waitForDataPersistence(delayMs: number = 1000) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Busca un registro con reintentos automáticos
 * Útil cuando hay delays de persistencia
 */
export async function findWithRetry<T>(
  findFn: () => Promise<T | null>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    logAttempts?: boolean;
  } = {}
): Promise<T | null> {
  const {
    maxRetries = 5,
    delayMs = 200,
    backoffMultiplier = 1.2,
    logAttempts = true,
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await findFn();
      if (result) {
        if (logAttempts && attempt > 0) {
          console.log(`✅ Encontrado en intento ${attempt + 1}`);
        }
        return result;
      }
    } catch (error) {
      if (logAttempts) {
        console.log(`⚠️ Error en búsqueda (${attempt + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : 'unknown error');
      }
    }

    if (attempt < maxRetries) {
      const currentDelay = Math.round(delayMs * Math.pow(backoffMultiplier, attempt));
      if (logAttempts) {
        console.log(`⏳ Reintentando en ${currentDelay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  if (logAttempts) {
    console.warn(`⚠️ No encontrado después de ${maxRetries + 1} intentos`);
  }
  return null;
}

/**
 * Espera con validación - repite una función hasta que devuelva true
 */
export async function waitUntil(
  conditionFn: () => Promise<boolean>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    timeout?: number;
  } = {}
): Promise<boolean> {
  const {
    maxAttempts = 10,
    delayMs = 200,
    timeout = 10000,
  } = options;

  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - startTime > timeout) {
      console.warn(`⚠️ Timeout esperando condición (${timeout}ms)`);
      return false;
    }

    try {
      const result = await conditionFn();
      if (result) {
        if (attempt > 0) {
          console.log(`✅ Condición cumplida en intento ${attempt + 1}`);
        }
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Error evaluando condición:`, error instanceof Error ? error.message : 'unknown');
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.warn(`⚠️ Condición no cumplida después de ${maxAttempts} intentos`);
  return false;
}
