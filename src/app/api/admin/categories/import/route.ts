/**
 * API de Importación CSV de Categorías - Versión Ultra Simple
 * POST /api/admin/categories/import
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { processCategoriesImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await processCategoriesImport(req);
  } catch (error) {
    console.error('[AdminImport] Error:', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
