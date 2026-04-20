/**
 * API de Importación CSV de Categorías - Versión Ultra Simple
 * POST /api/admin/categories/import
 */
import type { NextRequest } from 'next/server';

import { processCategoriesImport } from './processor';

export async function POST(req: NextRequest): Promise<Response> {
  return processCategoriesImport(req);
}
