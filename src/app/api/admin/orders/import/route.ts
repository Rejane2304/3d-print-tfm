/**
 * API de Importación CSV de Pedidos - Versión Ultra Simple
 * POST /api/admin/orders/import
 */
import type { NextRequest } from 'next/server';
import { processOrdersImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  return processOrdersImport(req);
}
