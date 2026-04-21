#!/usr/bin/env tsx
/**
 * Script para hacer baseline de migración en producción
 * Marca la migración como aplicada sin ejecutarla (la BD ya tiene las tablas)
 *
 * ⚠️ SOLO EJECUTAR UNA VEZ CUANDO:
 *   - La base de datos ya existe con datos
 *   - Es la primera vez que usas Prisma Migrate
 *   - Obtienes error P3005: "database schema is not empty"
 */

import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🗄️  PRISMA MIGRATE BASELINE - PRODUCCIÓN');
  console.log('==========================================');
  console.log('');
  console.log('Este script marca la migración inicial como "aplicada"');
  console.log('sin ejecutarla, porque la base de datos ya tiene las tablas.');
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - Esto es para hacer UNA SOLA VEZ');
  console.log('   - La BD debe tener el schema actual (columnas nameEs/nameEn)');
  console.log('   - Si la BD no tiene todas las columnas, NO ejecutes esto');
  console.log('');

  // Detectar entorno
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';

  const envPath = resolve(process.cwd(), envFile);
  config({ path: envPath });

  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: No se encontró DATABASE_URL o DIRECT_URL');
    console.error(`   Buscado en: ${envFile}`);
    process.exit(1);
  }

  // Validar que sea producción
  if (databaseUrl.includes('ctwbppfkfsuxymfouptb')) {
    console.log('✅ Detectada: Base de datos de PRODUCCIÓN');
    console.log('');
  } else if (databaseUrl.includes('hkjknnymctorucyhtypm')) {
    console.log('⚠️  Detectada: Base de datos de DESARROLLO');
    console.log('   En desarrollo puedes usar: npx prisma migrate dev');
    console.log('');
    const proceed = await question('¿Continuar con baseline de todas formas? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      console.log('❌ Cancelado');
      process.exit(0);
    }
  }

  // Confirmación final
  console.log('');
  console.log('🔴 CONFIRMACIÓN REQUERIDA');
  console.log('==========================');
  console.log('Vas a ejecutar:');
  console.log('  prisma migrate resolve --applied 20260416100000_init_complete');
  console.log('');
  console.log('Esto marcará la migración como aplicada SIN modificar la BD.');
  console.log('');

  const confirmation = await question('Escribe "BASELINE" para confirmar: ');

  if (confirmation !== 'BASELINE') {
    console.log('❌ Cancelado - palabra de confirmación incorrecta');
    process.exit(0);
  }

  console.log('');
  console.log('🚀 Ejecutando baseline...');
  console.log('');

  // Ejecutar prisma migrate resolve
  const result = spawnSync('npx', ['prisma', 'migrate', 'resolve', '--applied', '20260416100000_init_complete'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
  });

  if (result.status === 0) {
    console.log('');
    console.log('✅ BASELINE COMPLETADO EXITOSAMENTE');
    console.log('');
    console.log('La migración 20260416100000_init_complete está marcada como aplicada.');
    console.log('Prisma Migrate ahora está sincronizado con tu base de datos.');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  1. El deploy en Vercel debería funcionar ahora');
    console.log('  2. Futuras migraciones se aplicarán automáticamente');
  } else {
    console.log('');
    console.log('❌ ERROR AL EJECUTAR BASELINE');
    process.exit(1);
  }

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
