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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no está definida en .env.local');
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

const result = spawnSync('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 0);
