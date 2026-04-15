/**
 * API de Importación CSV de Zonas de Envío
 * POST /api/admin/shipping/import
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateErrorMessage } from '@/lib/i18n';

// Columnas requeridas
const REQUIRED_COLUMNS = ['name', 'countries', 'baseCost'];

interface ImportRow {
  name: string;
  countries: string;
  regions?: string;
  postalCodePrefixes?: string;
  baseCost: string;
  freeThreshold?: string;
  estimatedDaysMin?: string;
  estimatedDaysMax?: string;
  isActive?: string;
  displayOrder?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

// Validar y parsear array JSON
function parseArray(value: string): string[] {
  if (!value || value.trim() === '') return [];
  try {
    // Intentar parsear como JSON array
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
    return [];
  } catch {
    // Si falla, tratar como lista separada por comas
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

// Validar fila de datos
function validateRow(
  row: Record<string, string | number | boolean>,
  _rowIndex: number,
): { valid: boolean; errors: string[]; warnings: string[]; data?: ImportRow } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = String(row.name || '').trim();
  if (!name) errors.push('El nombre es obligatorio');
  if (name.length > 100) errors.push('El nombre no puede tener más de 100 caracteres');

  const countriesValue = String(row.countries || '');
  const countries = parseArray(countriesValue);
  if (countries.length === 0) errors.push('Debe incluir al menos un país');

  const baseCost = Number.parseFloat(String(row.baseCost || '0'));
  if (Number.isNaN(baseCost) || baseCost < 0) errors.push('El costo base debe ser un número mayor o igual a 0');

  // Opcional: regiones
  const regions = parseArray(String(row.regions || ''));

  // Opcional: prefijos de código postal
  const postalCodePrefixes = parseArray(String(row.postalCodePrefixes || ''));

  // Opcional: umbral de envío gratis
  const freeThreshold = String(row.freeThreshold || '');
  let freeShippingThreshold: number | undefined = undefined;
  if (freeThreshold && freeThreshold.trim() !== '') {
    const parsed = Number.parseFloat(freeThreshold);
    if (Number.isNaN(parsed) || parsed < 0) {
      warnings.push('El umbral de envío gratis es inválido, se ignorará');
    } else {
      freeShippingThreshold = parsed;
    }
  }

  // Opcional: días estimados
  const estimatedDaysMin = Number.parseInt(String(row.estimatedDaysMin || '3'), 10);
  const estimatedDaysMax = Number.parseInt(String(row.estimatedDaysMax || '5'), 10);
  if (Number.isNaN(estimatedDaysMin) || estimatedDaysMin < 1) {
    warnings.push('Días estimados mínimos inválidos, se usará 3');
  }
  if (Number.isNaN(estimatedDaysMax) || estimatedDaysMax < 1) {
    warnings.push('Días estimados máximos inválidos, se usará 5');
  }
  if (estimatedDaysMin > estimatedDaysMax) {
    warnings.push('Los días mínimos son mayores que los máximos, se intercambiarán');
  }

  // Opcional: activo
  const isActive = String(row.isActive || 'true').toLowerCase() !== 'false';

  // Opcional: orden de visualización
  const displayOrder = Number.parseInt(String(row.displayOrder || '0'), 10) || 0;

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      name,
      countries: countriesValue,
      regions: regions.length > 0 ? JSON.stringify(regions) : undefined,
      postalCodePrefixes: postalCodePrefixes.length > 0 ? JSON.stringify(postalCodePrefixes) : undefined,
      baseCost: String(baseCost),
      freeThreshold: freeShippingThreshold !== undefined ? String(freeShippingThreshold) : undefined,
      estimatedDaysMin: String(Math.min(estimatedDaysMin, estimatedDaysMax)),
      estimatedDaysMax: String(Math.max(estimatedDaysMin, estimatedDaysMax)),
      isActive: String(isActive),
      displayOrder: String(displayOrder),
    },
  };
}

// POST - Importar zonas de envío desde CSV
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 403 });
    }

    // Obtener datos del body
    const body = await req.json();
    const { data: rows, options = {} } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron datos para importar' }, { status: 400 });
    }

    // Validar columnas requeridas en la primera fila
    const firstRow = rows[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}` },
        { status: 400 },
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    // Validar todas las filas primero
    const validRows: { data: ImportRow; rowIndex: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i], i + 2); // +2 porque la fila 1 es el header
      if (validation.warnings) {
        result.warnings.push(...validation.warnings.map(w => ({ row: i + 2, message: w })));
      }
      if (!validation.valid || !validation.data) {
        result.errors.push(...validation.errors.map(e => ({ row: i + 2, message: e })));
      } else {
        validRows.push({ data: validation.data, rowIndex: i + 2 });
      }
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        errors: result.errors,
        warnings: result.warnings,
        message: 'No hay registros válidos para importar',
      });
    }

    // Verificar duplicados
    const existingZones = await prisma.shippingZone.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existingZones.map(z => z.name.toLowerCase()));

    // Importar en transacción
    await prisma.$transaction(async tx => {
      for (const { data, rowIndex } of validRows) {
        try {
          // Verificar duplicados
          if (!options.skipDuplicates && existingNames.has(data.name.toLowerCase())) {
            result.errors.push({ row: rowIndex, message: `La zona '${data.name}' ya existe` });
            continue;
          }

          if (options.skipDuplicates && existingNames.has(data.name.toLowerCase())) {
            result.warnings.push({ row: rowIndex, message: `Zona '${data.name}' omitida (duplicado)` });
            continue;
          }

          // Crear zona de envío
          await tx.shippingZone.create({
            data: {
              id: crypto.randomUUID(),
              name: data.name,
              country: parseArray(data.countries)[0] || 'Spain', // Usar el primer país
              regions: data.regions ? parseArray(data.regions) : [],
              postalCodePrefixes: data.postalCodePrefixes ? parseArray(data.postalCodePrefixes) : [],
              baseCost: Number.parseFloat(data.baseCost),
              freeShippingThreshold: data.freeThreshold ? Number.parseFloat(data.freeThreshold) : null,
              estimatedDaysMin: Number.parseInt(data.estimatedDaysMin || '3', 10),
              estimatedDaysMax: Number.parseInt(data.estimatedDaysMax || '5', 10),
              isActive: data.isActive === 'true',
              displayOrder: Number.parseInt(data.displayOrder || '0', 10),
              updatedAt: new Date(),
            },
          });

          result.imported++;
          existingNames.add(data.name.toLowerCase());
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            message: `Error al crear zona: ${(error as Error).message}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} zonas de envío importadas correctamente`
      : 'No se pudo importar ninguna zona de envío';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando zonas de envío:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
