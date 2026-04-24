/**
 * API de Importación CSV de Pedidos - Versión Ultra Simple
 * POST /api/admin/orders/import
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processOrdersImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await processOrdersImport(req);
  } catch (error) {
    console.error('[AdminImport] Error:', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
