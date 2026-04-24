/**
 * API de Importación CSV de Clientes - Versión Ultra Simple
 * POST /api/admin/clients/import
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processClientsImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await processClientsImport(req);
  } catch (error) {
    console.error('[AdminImport] Error:', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
