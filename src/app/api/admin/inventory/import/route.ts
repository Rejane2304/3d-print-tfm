/**
 * API de Importación CSV de Inventario - Versión Ultra Simple
 * POST /api/admin/inventory/import
 */
import type { NextRequest } from 'next/server';
import { processInventoryImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  return processInventoryImport(req);
}
