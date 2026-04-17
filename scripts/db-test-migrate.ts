#!/usr/bin/env tsx
/**
 * Script para ejecutar migraciones en la BD de test
 * Lee DATABASE_URL desde .env.test
 */

import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Cargar .env.test
const envPath = resolve(process.cwd(), '.env.test');
config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no está definida en .env.test');
  process.exit(1);
}

// Validar que sea la BD de test (no dev/producción)
if (!databaseUrl.includes('localhost:5433') || !databaseUrl.includes('test')) {
  console.error('❌ Error: DATABASE_URL no apunta a la BD de test. Abortando por seguridad.');
  console.error('   Esperado: localhost:5433 con base de datos "test"');
  process.exit(1);
}

console.log('🔄 Ejecutando migraciones en BD de test...');

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 0);
