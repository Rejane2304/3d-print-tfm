#!/usr/bin/env node
/**
 * Script para verificar ambas bases de datos
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabase(name, databaseUrl) {
  console.log(`\n🔍 === ${name} ===`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa');

    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    
    if (tables.length === 0) {
      console.log('⚠️  No hay tablas - Schema no sincronizado');
    } else {
      // Count records in main tables
      const mainTables = ['User', 'Product', 'Order', 'Invoice', 'Category'];
      for (const table of mainTables) {
        try {
          const count = await prisma[table.toLowerCase()].count();
          console.log(`   ${table}: ${count} registros`);
        } catch (e) {
          console.log(`   ${table}: ❌ Error - ${e.message.slice(0, 50)}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Check production (.env)
  const prodUrl = process.env.PROD_DATABASE_URL || 
    'postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';
  
  await checkDatabase('BASE DE DATOS DE PRODUCCIÓN', prodUrl);
  
  // Check development (.env.local)
  const devUrl = process.env.DEV_DATABASE_URL || 
    'postgresql://postgres.hkjknnymctorucyhtypm:putWa3-jinpeg-vorjeh@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';
  
  await checkDatabase('BASE DE DATOS DE DESARROLLO', devUrl);
  
  console.log('\n✅ Verificación completada');
}

main().catch(console.error);
