#!/usr/bin/env tsx
/**
 * Script para ejecutar migraciones en la BD de producción
 * Lee DATABASE_URL desde variables de entorno
 * ⚠️ Requiere confirmación manual
 */

import { spawnSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'node:readline';

// Cargar .env.production o .env.local
const envPath = resolve(process.cwd(), '.env.production') || resolve(process.cwd(), '.env.local');
config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no está definida');
  process.exit(1);
}

// Validar que sea la BD de producción
if (!databaseUrl.includes('ctwbppfkfsuxymfouptb')) {
  console.error('❌ Error: DATABASE_URL no apunta a producción. Usa db:migrate:dev para desarrollo.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  '⚠️  Vas a ejecutar migraciones en PRODUCCIÓN. ¿Confirmas? (escribe "PRODUCCION" para continuar): ',
  (answer: string) => {
    if (answer !== 'PRODUCCION') {
      console.log('❌ Operación cancelada.');
      rl.close();
      process.exit(1);
    }

    console.log('🔄 Ejecutando migraciones en BD de producción...');

    const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    rl.close();
    process.exit(result.status ?? 0);
  },
);
