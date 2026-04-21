#!/usr/bin/env node
/**
 * Script para verificar datos de productos en producción
 * Muestra los valores de nameEs vs nameEn
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando productos destacados...\n');

  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEs: true,
      nameEn: true,
      isFeatured: true,
    },
    take: 5,
  });

  console.log('Productos destacados encontrados:', products.length);
  console.log('\n--- Detalles ---\n');

  for (const p of products) {
    console.log(`ID: ${p.id}`);
    console.log(`Slug: ${p.slug}`);
    console.log(`name (legacy): ${p.name}`);
    console.log(`nameEs: ${p.nameEs}`);
    console.log(`nameEn: ${p.nameEn}`);
    console.log(`isFeatured: ${p.isFeatured}`);
    console.log('---');
  }

  // Verificar si hay diferencias
  const withDifferentNames = products.filter(p => p.nameEs !== p.nameEn);
  console.log(`\n⚠️  Productos con nameEs ≠ nameEn: ${withDifferentNames.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
