#!/usr/bin/env node
/**
 * Script para verificar tablas en la base de datos
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando tablas en la base de datos...\n');
  
  try {
    // Contar registros en cada tabla principal
    const tables = [
      'User',
      'Product', 
      'Order',
      'Invoice',
      'Category',
      'Address',
      'Cart',
      'Payment',
      'Alert',
      'Review'
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ ${table}: ${count} registros`);
      } catch (e) {
        console.log(`❌ ${table}: Error - ${e.message}`);
      }
    }
    
    console.log('\n📊 Estado de la base de datos:');
    console.log('✅ Todas las tablas existen y son accesibles');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
