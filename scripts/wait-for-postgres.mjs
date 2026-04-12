#!/usr/bin/env node

/**
 * ============================================
 * WAIT FOR POSTGRESQL TO BE READY
 * ============================================
 *
 * Script that waits for PostgreSQL in Docker
 * to be available before continuing
 */

import { execSync } from 'node:child_process';

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000; // 1 segundo
let retries = 0;

console.log('⏳ Waiting for PostgreSQL to be ready...');

function checkPostgres() {
  try {
    // Use pg_isready directly in the container
    execSync(
      'docker exec 3dprint-test-db pg_isready -U testuser -d 3dprint_tfm_test > /dev/null 2>&1',
      { stdio: 'pipe' }
    );
    console.log('✅ PostgreSQL está listo');
    return true;
  } catch {
    retries++;
    if (retries >= MAX_RETRIES) {
      console.error('❌ Error: PostgreSQL is not responding after 30 seconds');
      console.error('   Verify that Docker is running:');
      console.error('   docker-compose -f docker-compose.test.yml ps');
      process.exit(1);
    }
    const dots = '.'.repeat((retries % 3) + 1);
    process.stdout.write(`\r⏳ Waiting for PostgreSQL ${dots}  `);
    setTimeout(checkPostgres, RETRY_INTERVAL);
  }
}

checkPostgres();
