/**
 * ============================================
 * SECURITY TESTS - DATABASE ISOLATION
 * ============================================
 * 
 * Validates that tests run against an isolated database
 * and NEVER against development/production databases.
 * 
 * These tests are MANDATORY and CANNOT be skipped.
 * They ensure production data safety.
 */
import { describe, it, expect } from 'vitest';
import { getDBInfo, validateTestDBSync } from '../../helpers';

describe('🔒 Security - Database Isolation (MANDATORY)', () => {
  it('must be running against test database', () => {
    const dbInfo = getDBInfo();

    // STRICT: Database name must contain "test"
    expect(dbInfo.isTest).toBe(true);
    
    // STRICT: Not a production database
    expect(dbInfo.isProduction).toBe(false);
    
    // STRICT: Environment must be valid
    expect(dbInfo.isValidEnvironment).toBe(true);
  });

  it('NODE_ENV must be "test"', () => {
    // STRICT: NODE_ENV must be exactly "test"
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('DATABASE_URL must not point to default production DB', () => {
    const url = process.env.DATABASE_URL || '';
    
    // STRICT: Should not be the default "postgres" Supabase database
    expect(url).not.toContain('/postgres?');
    expect(url).not.toContain(':5432/postgres');
  });

  it('DATABASE_URL must contain "test" in database name', () => {
    const url = process.env.DATABASE_URL || '';
    const dbNameMatch = /\/([^/?]+)(\?|$)/.exec(url);
    const dbName = dbNameMatch ? dbNameMatch[1] : '';
    
    // STRICT: Database name must contain "test"
    expect(dbName.toLowerCase()).toContain('test');
  });

  it('should display correct database information', () => {
    const dbInfo = getDBInfo();

    console.log('📊 Database Info:');
    console.log(`   Database: ${dbInfo.database}`);
    console.log(`   Is Test: ${dbInfo.isTest}`);
    console.log(`   Is Production: ${dbInfo.isProduction}`);
    console.log(`   NODE_ENV: ${dbInfo.nodeEnv}`);
    console.log(`   Is Valid: ${dbInfo.isValidEnvironment}`);

    expect(dbInfo).toBeDefined();
    expect(dbInfo.database).toBeDefined();
    expect(dbInfo.database).not.toBe('unknown');
  });

  it('should pass synchronous validation', () => {
    // This will throw if validation fails
    expect(() => validateTestDBSync()).not.toThrow();
  });

  it('should have test-specific database port or name', () => {
    const url = process.env.DATABASE_URL || '';
    
    const isTestPort = url.includes(':5433') || url.includes(':5434') || url.includes(':5435');
    const dbNameMatch = /\/([^/?]+)(\?|$)/.exec(url);
    const dbName = dbNameMatch ? dbNameMatch[1] : '';
    const isTestName = dbName.toLowerCase().includes('test');
    
    // Should have either test port or test name
    expect(isTestPort || isTestName).toBe(true);
  });
});
