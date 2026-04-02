#!/usr/bin/env node

/**
 * ============================================
 * ESPERA A QUE POSTGRESQL ESTÉ LISTO
 * ============================================
 * 
 * Script que espera a que PostgreSQL en Docker
 * esté disponible antes de continuar
 */

const { execSync } = require('child_process');

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000; // 1 segundo
let retries = 0;

console.log('⏳ Esperando a que PostgreSQL esté listo...');

function checkPostgres() {
  try {
    // Usar pg_isready directamente en el contenedor
    execSync(
      "docker exec 3dprint-test-db pg_isready -U testuser -d 3dprint_tfm_test > /dev/null 2>&1",
      { stdio: 'pipe' }
    );
    console.log('✅ PostgreSQL está listo');
    return true;
  } catch (error) {
    retries++;
    if (retries >= MAX_RETRIES) {
      console.error('❌ Error: PostgreSQL no está respondiendo después de 30 segundos');
      console.error('   Verifica que Docker está corriendo:');
      console.error('   docker-compose -f docker-compose.test.yml ps');
      process.exit(1);
    }
    
    const dots = '.'.repeat((retries % 3) + 1);
    process.stdout.write(`\r⏳ Esperando PostgreSQL ${dots}  `);
    
    setTimeout(checkPostgres, RETRY_INTERVAL);
  }
}

checkPostgres();
