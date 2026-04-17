#!/usr/bin/env tsx
/**
 * Seed Production Database with Safety Confirmation
 *
 * ⚠️  ADVERTENCIA CRÍTICA: Este script ejecutará el seed en la BASE DE DATOS DE PRODUCCIÓN.
 * Esto eliminará TODOS los datos existentes y los reemplazará con los datos iniciales del seed.
 *
 * Requiere confirmación interactiva para evitar ejecución accidental.
 */

import * as readline from 'node:readline';
import { execSync } from 'node:child_process';

const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL;

if (!PROD_DATABASE_URL) {
  console.error('❌ Error: PROD_DATABASE_URL no está definida en las variables de entorno');
  console.error('   Configure la variable PROD_DATABASE_URL antes de ejecutar este script');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n' + '═'.repeat(80));
console.log('║' + ' '.repeat(78) + '║');
console.log('║' + '⚠️  ADVERTENCIA CRÍTICA'.padStart(50).padEnd(78) + '║');
console.log('║' + ' '.repeat(78) + '║');
console.log('║  Estás a punto de ejecutar el SEED en la BASE DE DATOS DE PRODUCCIÓN.'.padEnd(78) + '║');
console.log('║' + ' '.repeat(78) + '║');
console.log('║  Esto hará:'.padEnd(78) + '║');
console.log('║    • TRUNCATE de TODAS las tablas'.padEnd(78) + '║');
console.log('║    • Eliminación de TODOS los datos existentes'.padEnd(78) + '║');
console.log('║    • Inserción de datos iniciales (10 productos, categorías, etc.)'.padEnd(78) + '║');
console.log('║' + ' '.repeat(78) + '║');
console.log('║  Consecuencias:'.padEnd(78) + '║');
console.log('║    ❌ Pérdida total de datos de clientes'.padEnd(78) + '║');
console.log('║    ❌ Pérdida total de pedidos históricos'.padEnd(78) + '║');
console.log('║    ❌ Pérdida total de pagos procesados'.padEnd(78) + '║');
console.log('║' + ' '.repeat(78) + '║');
console.log('═'.repeat(80) + '\n');

rl.question('Escribe "PRODUCCION" para confirmar que deseas continuar: ', answer => {
  if (answer.trim() === 'PRODUCCION') {
    console.log('\n✅ Confirmación recibida. Ejecutando seed en producción...\n');

    try {
      // Ejecutar el seed con la URL de producción
      execSync(`DATABASE_URL="${PROD_DATABASE_URL}" npx prisma db seed`, {
        stdio: 'inherit',
        cwd: '/Users/rejanerodrigues/MASTER/3d-print-tfm',
      });

      console.log('\n' + '═'.repeat(80));
      console.log('║' + '✅ Seed en producción completado exitosamente'.padStart(60).padEnd(78) + '║');
      console.log('═'.repeat(80) + '\n');

      process.exit(0);
    } catch (error) {
      console.error('\n❌ Error ejecutando seed:', error);
      process.exit(1);
    }
  } else {
    console.log('\n❌ Confirmación incorrecta o cancelada."PRODUCCION"');
    console.log('❌ Operación abortada. No se realizaron cambios en la base de datos.\n');
    process.exit(1);
  }

  rl.close();
});
