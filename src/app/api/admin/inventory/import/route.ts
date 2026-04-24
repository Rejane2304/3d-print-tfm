/**
 * API de Importación CSV de Inventario - Versión Ultra Simple
 * POST /api/admin/inventory/import
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processInventoryImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await processInventoryImport(req);
  } catch (error) {
    console.error('[AdminImport] Error:', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
