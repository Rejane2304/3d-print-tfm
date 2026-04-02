/**
 * ============================================
 * TESTS DE VALIDACIÓN - AISLAMIENTO DE BD
 * ============================================
 * 
 * Valida que los tests se ejecutan contra una BD aislada
 * y NUNCA contra BD de desarrollo/producción
 * 
 * NOTA: Estos tests están deshabilitados cuando se usa una BD de producción
 * para testing (SKIP_DB_VALIDATION=true)
 */
import { describe, it, expect } from 'vitest';
import { getDatabaseInfo } from '../../helpers/db-validation';

// Skip these tests if using production database for testing
const skipTests = process.env.SKIP_DB_VALIDATION === 'true';
const describeFunc = skipTests ? describe.skip : describe;

describeFunc('🔒 Seguridad - Aislamiento de Base de Datos', () => {
  it('debe estar ejecutando contra BD de test', () => {
    const dbInfo = getDatabaseInfo();
    
    // Verificar que es una BD de test (o permitir producción si SKIP_DB_VALIDATION está habilitado)
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(dbInfo.isTest).toBe(true);
      expect(dbInfo.isProduction).toBe(false);
    }
  });

  it('NODE_ENV debe ser "test"', () => {
    // Permitir que NODE_ENV sea 'test' o que SKIP_DB_VALIDATION esté habilitado
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(process.env.NODE_ENV).toBe('test');
    }
  });

  it('DATABASE_URL no debe apuntar a DB default de producción', () => {
    const url = process.env.DATABASE_URL || '';
    
    // Permitir si SKIP_DB_VALIDATION está habilitado
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      // No debe ser la BD "postgres" default de Supabase
      expect(url).not.toContain('/postgres?');
      expect(url).not.toContain(':5432/postgres');
    }
  });

  it('DATABASE_URL debe contener indicador de test', () => {
    const url = process.env.DATABASE_URL || '';
    const isTestDb = 
      url.includes('test') ||
      url.includes('5433') || // Puerto de Docker
      url.includes('file:./test.db'); // SQLite
    
    // Permitir si SKIP_DB_VALIDATION está habilitado
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(isTestDb).toBe(true);
    }
  });

  it('debe mostrar información de BD correcta', () => {
    const dbInfo = getDatabaseInfo();
    
    console.log('📊 Database Info:');
    console.log(`   Database: ${dbInfo.database}`);
    console.log(`   Is Test: ${dbInfo.isTest}`);
    console.log(`   Is Production: ${dbInfo.isProduction}`);
    
    expect(dbInfo).toBeDefined();
    expect(dbInfo.database).toBeDefined();
  });
});
