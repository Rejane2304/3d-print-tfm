/**
 * API de Importación CSV de Cupones - Versión Ultra Simple
 * POST /api/admin/coupons/import
 */
import type { NextRequest } from 'next/server';
import { processCouponsImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  return processCouponsImport(req);
}
