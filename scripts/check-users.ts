import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios...\n');
  
  const usuarios = await prisma.usuario.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 25,
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      creadoEn: true,
    },
  });
  
  console.log(`Total de usuarios encontrados: ${usuarios.length}\n`);
  
  const tablaUsuarios = usuarios.map((u: { 
    id: string; 
    email: string; 
    nombre: string; 
    rol: string; 
    activo: boolean; 
    creadoEn: Date;
  }) => ({
    id: u.id.substring(0, 10) + '...',
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo ? '✅' : '❌',
    creado: u.creadoEn.toISOString().split('T')[0],
  }));
  
  console.table(tablaUsuarios);
  
  // Contar por rol
  const porRol = await prisma.usuario.groupBy({
    by: ['rol'],
    _count: { rol: true },
  });
  
  console.log('\n📊 Distribución por rol:');
  porRol.forEach((r: { rol: string; _count: { rol: number } }) => {
    console.log(`  ${r.rol}: ${r._count.rol}`);
  });
  
  // Verificar si hay usuarios de test
  const usuariosTest = await prisma.usuario.findMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { nombre: { contains: 'Test' } },
      ],
    },
  });
  
  console.log(`\n🧪 Usuarios de test encontrados: ${usuariosTest.length}`);
  usuariosTest.forEach((u: { email: string; nombre: string }) => {
    console.log(`  - ${u.email} (${u.nombre})`);
  });
  
  await prisma.$disconnect();
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
