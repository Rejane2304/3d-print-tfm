import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios...\n');
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  
  console.log(`Total de usuarios encontrados: ${users.length}\n`);
  
  const userTable = users.map((u: { 
    id: string; 
    email: string; 
    name: string; 
    role: string; 
    isActive: boolean; 
    createdAt: Date;
  }) => ({
    id: u.id.substring(0, 10) + '...',
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.isActive ? '✅' : '❌',
    created: u.createdAt.toISOString().split('T')[0],
  }));
  
  console.table(userTable);
  
  // Contar por rol
  const byRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });
  
  console.log('\n📊 Distribución por rol:');
  byRole.forEach((r: { role: string; _count: { role: number } }) => {
    console.log(`  ${r.role}: ${r._count.role}`);
  });
  
  // Verificar si hay usuarios de test
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { name: { contains: 'Test' } },
      ],
    },
  });
  
  console.log(`\n🧪 Usuarios de test encontrados: ${testUsers.length}`);
  testUsers.forEach((u: { email: string; name: string }) => {
    console.log(`  - ${u.email} (${u.name})`);
  });
  
  await prisma.$disconnect();
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
