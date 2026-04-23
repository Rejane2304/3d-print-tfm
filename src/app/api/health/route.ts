/**
 * Health Check API Route
 * Verifica conexión a base de datos y estado del sistema
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    env: {
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
      directUrl: process.env.DIRECT_URL ? 'Configurado' : 'No configurado',
    },
    error: null as string | null,
  };

  try {
    // Intentar consulta simple
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.error = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Health Check] Database connection failed:', error);
  }

  const status = checks.database ? 200 : 503;

  return NextResponse.json(checks, { status });
}
