/**
 * API de Importación CSV de Cupones - Versión Ultra Simple
 * POST /api/admin/coupons/import
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processCouponsImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await processCouponsImport(req);
  } catch (error) {
    console.error('[AdminImport] Error:', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
