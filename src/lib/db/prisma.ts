/**
 * Prisma Client with connection pooling for Supabase
 * Optimized for serverless environments with connection limits
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración optimizada para Supabase con connection pooling
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Solo log queries en development cuando se habilita explícitamente
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Middleware para manejar errores de conexión
  client.$use(async (params, next) => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await next(params);
        return result;
      } catch (error: unknown) {
        attempt++;

        // Verificar si es error de conexión
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isConnectionError =
          errorMessage.includes('MaxClientsInSessionMode') ||
          errorMessage.includes('Connection') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('ECONNREFUSED');

        if (isConnectionError && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
          logger.warn(
            `Prisma connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${errorMessage}`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Si no es error de conexión o se agotaron reintentos, lanzar el error
        throw error;
      }
    }

    throw new Error('Max retries exceeded for Prisma query');
  });

  return client;
};

// Singleton pattern - solo una instancia de Prisma
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función helper para ejecutar queries con retry explícito
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  options: { maxRetries?: number; retryDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      attempt++;

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isConnectionError =
        errorMessage.includes('MaxClientsInSessionMode') ||
        errorMessage.includes('Connection') ||
        errorMessage.includes('timeout');

      if (isConnectionError && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// Función para cerrar conexiones limpiamente
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Prisma disconnected cleanly');
}

// Manejar cierre graceful con logger
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
