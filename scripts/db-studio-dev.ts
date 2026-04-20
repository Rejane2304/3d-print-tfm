#!/usr/bin/env tsx
/**
 * Script para abrir Prisma Studio en la BD de desarrollo
 * Lee DATABASE_URL desde variables de entorno
 */

import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Cargar .env.local
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Usar DIRECT_URL para Prisma Studio (requiere conexión directa, no pgbouncer)
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DIRECT_URL o DATABASE_URL no están definidos en .env.local');
  process.exit(1);
}

// Validar que sea la BD de desarrollo (no producción)
if (databaseUrl.includes('ctwbppfkfsuxymfouptb')) {
  console.error('❌ Error: DATABASE_URL apunta a producción. Abortando.');
  process.exit(1);
}

// Validar que sea localhost o Supabase dev
if (!databaseUrl.includes('localhost') && !databaseUrl.includes('hkjknnymctorucyhtypm')) {
  console.error('❌ Error: DATABASE_URL no parece ser de desarrollo. Abortando por seguridad.');
  process.exit(1);
}

console.log('🎨 Abriendo Prisma Studio en BD de desarrollo...');
console.log('   Usando DIRECT_URL para conexión directa (sin pgbouncer)');

const result = spawnSync('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    // Deshabilitar SSL estricto para desarrollo local
    PRISMA_CLIENT_ENGINE_TYPE: 'library',
  },
});

process.exit(result.status ?? 0);
