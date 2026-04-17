/**
 * API de Importación CSV de Clientes - Versión Ultra Simple
 * POST /api/admin/clients/import
 */
import type { NextRequest } from 'next/server';
import { processClientsImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  return processClientsImport(req);
}
