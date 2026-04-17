#!/usr/bin/env tsx
/**
 * Script para reset completo de la BD de desarrollo
 * Lee DATABASE_URL y DIRECT_URL desde variables de entorno
 */

import { spawnSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env.local
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  console.error('❌ Error: DATABASE_URL o DIRECT_URL no están definidas en .env.local');
  process.exit(1);
}

// Validar que sea la BD de desarrollo (no producción)
if (databaseUrl.includes('ctwbppfkfsuxymfouptb') || directUrl.includes('ctwbppfkfsuxymfouptb')) {
  console.error('❌ Error: DATABASE_URL o DIRECT_URL apuntan a producción. Abortando.');
  process.exit(1);
}

// Validar que sea localhost o Supabase dev
const isDevDb = (url: string) => url.includes('localhost') || url.includes('hkjknnymctorucyhtypm');

if (!isDevDb(databaseUrl) || !isDevDb(directUrl)) {
  console.error('❌ Error: Las URLs no parecen ser de desarrollo. Abortando por seguridad.');
  process.exit(1);
}

console.log('🔄 Ejecutando reset completo en BD de desarrollo...');

const result = spawnSync('tsx', ['scripts/reset-and-seed.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl },
});

process.exit(result.status ?? 0);
