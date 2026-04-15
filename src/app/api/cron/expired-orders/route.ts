/**
 * Cron Job: Expired Orders
 * API Route para cancelacion automatica de pedidos expirados
 *
 * POST /api/cron/expired-orders
 *
 * Headers requeridos:
 * - Authorization: Bearer ${CRON_SECRET}
 *
 * Query params opcionales:
 * - dryRun: true (solo muestra pedidos sin cancelar)
 * - hours: numero de horas para considerar expirado (default: 24)
 *
 * Este endpoint debe ser llamado por:
 * - Vercel Cron Jobs (cada hora)
 * - Servicio externo de cron (Railway, etc.)
 * - Manualmente para testing
 *
 * Configuracion de Vercel Cron (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/expired-orders",
 *       "schedule": "0 * * * *"
 *     }
 *   ]
 * }
 *
 * Schedule format: cron expression
 * Ejemplos:
 * - 0 * * * * = Cada hora en punto
 * - 0 asterisco/6 * * * = Cada 6 horas
 * - 0 0 * * * = Todos los dias a medianoche
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  processExpiredOrders,
  findExpiredOrders,
  getExpiredOrdersStats,
  type ExpiredOrderConfig,
} from '@/lib/cron/expired-orders';
import { logger } from '@/lib/logger';

// Configuracion de autenticacion
const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * Verifica la autorizacion del request
 */
function verifyAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    logger.security('Intento de acceso sin autorizacion a cron/expired-orders');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!CRON_SECRET) {
    logger.error('CRON_SECRET no configurado en variables de entorno');
    return false;
  }

  return token === CRON_SECRET;
}

/**
 * GET /api/cron/expired-orders
 * Obtiene estadisticas de pedidos expirados sin procesarlos
 * Util para monitoreo
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorizacion
    if (!verifyAuthorization(request)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const stats = await getExpiredOrdersStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error en GET /api/cron/expired-orders', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/cron/expired-orders
 * Procesa pedidos expirados y libera stock
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autorizacion
    if (!verifyAuthorization(request)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const hoursParam = searchParams.get('hours');
    const batchSizeParam = searchParams.get('batchSize');

    const config: Partial<ExpiredOrderConfig> = {};
    if (hoursParam) config.expirationHours = parseInt(hoursParam, 10);
    if (batchSizeParam) config.batchSize = parseInt(batchSizeParam, 10);

    logger.info('Iniciando cron de pedidos expirados', {
      dryRun,
      config,
    });

    // Si es dryRun, solo buscar y mostrar sin procesar
    if (dryRun) {
      const expiredOrders = await findExpiredOrders(config);

      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          wouldProcess: expiredOrders.length,
          orders: expiredOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            itemCount: order.items.length,
          })),
        },
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Procesar pedidos expirados
    const result = await processExpiredOrders(config);

    const response = {
      success: true,
      data: {
        processed: result.processed,
        cancelled: result.cancelled,
        errors: result.errors,
        details: result.details,
      },
      executionTimeMs: Date.now() - startTime,
    };

    // Log del resultado
    logger.info('Cron de pedidos expirados completado', {
      processed: result.processed,
      cancelled: result.cancelled,
      errors: result.errors,
      executionTimeMs: Date.now() - startTime,
    });

    // Si hubo errores, retornar 207 (Multi-Status)
    if (result.errors > 0) {
      return NextResponse.json(response, { status: 207 });
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error en POST /api/cron/expired-orders', error, {
      executionTimeMs: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

// Configuracion para Next.js 14 App Router
export const runtime = 'nodejs';
export const maxDuration = 30;
