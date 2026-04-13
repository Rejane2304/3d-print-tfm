/**
 * Prisma Client with connection pooling for Supabase
 * Optimized for serverless environments with connection limits
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración optimizada para Supabase con connection pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Log queries only in development
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

// Singleton pattern - solo una instancia de Prisma
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para cerrar conexiones limpiamente
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// Manejar cierre graceful
process.on('beforeExit', async() => {
  await prisma.$disconnect();
});

process.on('SIGINT', async() => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async() => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
