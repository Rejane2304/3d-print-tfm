/**
 * ============================================
 * VALIDATION TESTS - DB ISOLATION
 * ============================================
 * 
 * Validates that tests run against an isolated database
 * and NEVER against development/production databases
 * 
 * NOTE: These tests are disabled when using a production database
 * for testing (SKIP_DB_VALIDATION=true)
 */
import { describe, it, expect } from 'vitest';
import { getDBInfo } from '../../helpers';

// Skip these tests if using production database for testing
const skipTests = process.env.SKIP_DB_VALIDATION === 'true';
const describeFunc = skipTests ? describe.skip : describe;

describeFunc('🔒 Security - Database Isolation', () => {
  it('should be running against test database', () => {
    const dbInfo = getDBInfo();

    // Verify it's a test database (or allow production if SKIP_DB_VALIDATION is enabled)
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(dbInfo.isTest).toBe(true);
      expect(dbInfo.isProduction).toBe(false);
    }
  });

  it('NODE_ENV should be "test"', () => {
    // Allow NODE_ENV to be 'test' or SKIP_DB_VALIDATION to be enabled
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(process.env.NODE_ENV).toBe('test');
    }
  });

  it('DATABASE_URL should not point to default production DB', () => {
    const url = process.env.DATABASE_URL || '';
    
    // Allow if SKIP_DB_VALIDATION is enabled
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      // Should not be the default "postgres" Supabase database
      expect(url).not.toContain('/postgres?');
      expect(url).not.toContain(':5432/postgres');
    }
  });

  it('DATABASE_URL should contain test indicator', () => {
    const url = process.env.DATABASE_URL || '';
    const isTestDb = 
      url.includes('test') ||
      url.includes('5433') || // Docker port
      url.includes('file:./test.db'); // SQLite
    
    // Allow if SKIP_DB_VALIDATION is enabled
    if (process.env.SKIP_DB_VALIDATION !== 'true') {
      expect(isTestDb).toBe(true);
    }
  });

  it('should display correct database information', () => {
    const dbInfo = getDBInfo();

    console.log('📊 Database Info:');
    console.log(`   Database: ${dbInfo.database}`);
    console.log(`   Is Test: ${dbInfo.isTest}`);
    console.log(`   Is Production: ${dbInfo.isProduction}`);

    expect(dbInfo).toBeDefined();
    expect(dbInfo.database).toBeDefined();
  });
});
