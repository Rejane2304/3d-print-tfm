/**
 * Database Safety Validation Script
 * 
 * This script tests the database safety measures.
 * Run with different NODE_ENV values to verify protection.
 * 
 * Usage:
 *   NODE_ENV=test npm run validate-db-safety
 *   NODE_ENV=development npm run validate-db-safety  # Should fail
 */

import { validateTestDB, validateTestDBSync, getDBInfo } from '../tests/helpers';

async function main() {
  console.log('🔍 Database Safety Validation');
  console.log('================================\n');
  
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database Info:', getDBInfo());
  console.log();
  
  try {
    // Test synchronous validation
    console.log('Testing synchronous validation...');
    validateTestDBSync();
    console.log('✅ Synchronous validation passed\n');
    
    // Test async validation
    console.log('Testing async validation...');
    await validateTestDB();
    console.log('✅ Async validation passed\n');
    
    console.log('🎉 All validations passed! Database is safe for testing.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
