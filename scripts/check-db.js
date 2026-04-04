const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking products in database...');
  const count = await prisma.product.count();
  console.log(`Product count: ${count}`);

  const products = await prisma.product.findMany({ take: 20 });
  console.log('Products:', products.map(p => ({ id: p.id, name: p.name, slug: p.slug })));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
