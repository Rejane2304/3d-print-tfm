#!/usr/bin/env node
/**
 * Script para migrar columnas bilingües en producción
 * Añade columnas nullable, migra datos, luego hace NOT NULL
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('🔧 Migrando columnas bilingües...');

  const prisma = new PrismaClient();

  try {
    // Verificar si ya existen las columnas
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'nameEs'
    `;

    if (result.length > 0) {
      console.log('✅ Columnas bilingües ya existen');
      return;
    }

    console.log('📝 Añadiendo columnas bilingües...');

    // Añadir columnas como nullable primero
    await prisma.$executeRaw`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "nameEs" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "nameEn" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "descriptionEs" TEXT,
      ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT,
      ADD COLUMN IF NOT EXISTS "shortDescEs" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "shortDescEn" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "metaTitleEs" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "metaTitleEn" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "metaDescEs" VARCHAR(300),
      ADD COLUMN IF NOT EXISTS "metaDescEn" VARCHAR(300)
    `;

    console.log('🔄 Migrando datos existentes...');

    // Copiar datos de columnas legacy a columnas bilingües
    await prisma.$executeRaw`
      UPDATE "products" 
      SET 
        "nameEs" = name,
        "nameEn" = name,
        "descriptionEs" = description,
        "descriptionEn" = description,
        "shortDescEs" = "shortDescription",
        "shortDescEn" = "shortDescription",
        "metaTitleEs" = "metaTitle",
        "metaTitleEn" = "metaTitle",
        "metaDescEs" = "metaDescription",
        "metaDescEn" = "metaDescription"
    `;

    console.log('🔒 Haciendo columnas NOT NULL...');

    // Hacer las columnas required
    await prisma.$executeRaw`
      ALTER TABLE "products" 
      ALTER COLUMN "nameEs" SET NOT NULL,
      ALTER COLUMN "nameEn" SET NOT NULL,
      ALTER COLUMN "descriptionEs" SET NOT NULL,
      ALTER COLUMN "descriptionEn" SET NOT NULL
    `;

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
