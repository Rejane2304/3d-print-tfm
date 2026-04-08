import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { slug: 'asc' }
    });
    
    console.log('=== Current Products in Database ===\n');
    products.forEach(p => {
      console.log(`${p.slug}: ${p.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();