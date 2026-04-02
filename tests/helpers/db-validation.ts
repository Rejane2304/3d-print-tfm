/**
 * ============================================
 * VALIDACIÓN DE SEGURIDAD - AISLAMIENTO DE BD
 * ============================================
 * 
 * Este módulo valida que los tests se ejecuten
 * contra una BD aislada, NO contra BD de producción
 */

/**
 * Valida que estamos usando una BD aislada para tests
 * Lanza excepción si detecta que se está usando BD de producción
 */
export async function validateTestDatabaseIsolation(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;
  const skipValidation = process.env.SKIP_DB_VALIDATION === 'true';

  if (skipValidation) {
    console.warn('⚠️  Validación de BD deshabilitada (SKIP_DB_VALIDATION=true)');
    return;
  }

  // ============================================
  // VALIDACIÓN 1: NODE_ENV debe ser 'test'
  // ============================================
  if (nodeEnv !== 'test') {
    throw new Error(
      `🔴 SEGURIDAD: NODE_ENV debe ser 'test', pero es '${nodeEnv}'\n` +
      `   Estás intentando ejecutar tests contra una BD de ${nodeEnv}!\n` +
      `   Carga .env.test correctamente antes de ejecutar tests`
    );
  }

  // ============================================
  // VALIDACIÓN 2: DATABASE_URL debe ser de test
  // ============================================
  
  // Detectar bases de datos conocidas de producción
  const isProduccionUrl = 
    databaseUrl.includes('/postgres?') ||  // BD default de Supabase
    databaseUrl.includes(':5432/postgres') || // BD default local
    databaseUrl.includes('prod') || // URLs con 'prod'
    databaseUrl.includes('production'); // URLs con 'production'

  if (isProduccionUrl) {
    throw new Error(
      `🔴 CRÍTICO: Detectado intento de ejecutar tests contra BD de PRODUCCIÓN\n` +
      `   DATABASE_URL: ${databaseUrl}\n` +
      `   \n` +
      `   Debes crear una BD SEPARADA para tests:\n` +
      `   1. Crea 'postgresql://...@.../3dprint_tfm_test'\n` +
      `   2. Actualiza .env.test con esta URL\n` +
      `   3. Ejecuta: npx prisma migrate deploy\n` +
      `   4. Intenta de nuevo\n` +
      `   \n` +
      `   O usa Docker:\n` +
      `   docker-compose -f docker-compose.test.yml up -d\n` +
      `   export DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test\n` +
      `   npm run test:integration`
    );
  }

  // ============================================
  // VALIDACIÓN 3: DATABASE_URL debe mencionar 'test'
  // ============================================
  const isTestUrl = 
    databaseUrl.includes('test') ||
    databaseUrl.includes(':5433') || // Puerto Docker para tests
    databaseUrl.includes('file:./test.db'); // SQLite para tests

  if (!isTestUrl) {
    console.warn(
      `⚠️  ADVERTENCIA: DATABASE_URL no contiene 'test':\n` +
      `   ${databaseUrl}\n` +
      `   \n` +
      `   ¿Estás seguro que esta es una BD aislada?\n` +
      `   Continuar en 2 segundos...`
    );
    
    // Esperar 2 segundos para que el usuario pueda Ctrl+C
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // ============================================
  // VALIDACIÓN 4: SKIP_DB_TESTS debe estar false
  // ============================================
  if (process.env.SKIP_DB_TESTS === 'true') {
    console.warn(
      `⚠️  ADVERTENCIA: Tests de BD están deshabilitados (SKIP_DB_TESTS=true)\n` +
      `   Los tests NO se ejecutarán contra BD\n` +
      `   Para habilitar, cambia a SKIP_DB_TESTS=false`
    );
  }

  console.log('✅ Validación de BD: OK - Usando BD aislada para tests');
}

/**
 * Detecta si estamos en ambiente de test
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST_ENV === 'integration';
}

/**
 * Obtiene información sobre la BD actual
 */
export function getDatabaseInfo() {
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';

  return {
    url: url.substring(0, 50) + '...',
    database: dbName,
    isTest: dbName.includes('test'),
    isProduction: url.includes('prod') || url.includes('production'),
  };
}
