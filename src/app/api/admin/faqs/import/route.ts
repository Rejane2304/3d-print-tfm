/**
 * API de Importación CSV de FAQs
 * POST /api/admin/faqs/import
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
const REQUIRED_COLUMNS = ['question', 'answer', 'category'];

// Categorías válidas
const VALID_CATEGORIES = ['Materials', 'Shipping', 'Returns', 'Orders', 'Care', 'Payments', 'Safety', 'General'];

interface ImportRow {
  question: string;
  answer: string;
  category: string;
  order?: string;
  isActive?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  message?: string;
}

// Validar fila de datos
function validateRow(
  row: Record<string, string | number | boolean>,
  _rowIndex: number,
): { valid: boolean; errors: string[]; warnings: string[]; data?: ImportRow } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const question = String(row.question || '').trim();
  if (!question) errors.push('La pregunta es obligatoria');
  if (question.length > 500) errors.push('La pregunta no puede tener más de 500 caracteres');

  const answer = String(row.answer || '').trim();
  if (!answer) errors.push('La respuesta es obligatoria');
  if (answer.length > 5000) errors.push('La respuesta no puede tener más de 5000 caracteres');

  let category = String(row.category || '').trim();
  if (!category) {
    errors.push('La categoría es obligatoria');
  } else {
    // Intentar mapear categoría en español a inglés
    const categoryMap: Record<string, string> = {
      materiales: 'Materials',
      envío: 'Shipping',
      envio: 'Shipping',
      devoluciones: 'Returns',
      pedidos: 'Orders',
      cuidado: 'Care',
      pagos: 'Payments',
      seguridad: 'Safety',
      general: 'General',
    };

    const normalizedCategory = category.toLowerCase();
    if (categoryMap[normalizedCategory]) {
      category = categoryMap[normalizedCategory];
    }

    // Capitalizar primera letra
    category = category.charAt(0).toUpperCase() + category.slice(1);

    if (!VALID_CATEGORIES.includes(category)) {
      warnings.push(`Categoría '${category}' no está en la lista estándar, se usará como está`);
    }
  }

  // Opcional: orden
  const order = Number.parseInt(String(row.order || row.displayOrder || '0'), 10);
  if (Number.isNaN(order) || order < 0) {
    warnings.push('Orden inválido, se usará 0');
  }

  // Opcional: activo
  const isActive = String(row.isActive || 'true').toLowerCase() !== 'false';

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      question,
      answer,
      category,
      order: String(order || 0),
      isActive: String(isActive),
    },
  };
}

// POST - Importar FAQs desde CSV
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

    // Validar columnas requeridas
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
      const validation = validateRow(rows[i], i + 2);
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

    // Verificar duplicados por pregunta
    const existingFAQs = await prisma.fAQ.findMany({
      select: { question: true },
    });
    const existingQuestions = new Set(existingFAQs.map(f => f.question.toLowerCase().trim()));

    // Importar en transacción
    await prisma.$transaction(async tx => {
      for (const { data, rowIndex } of validRows) {
        try {
          // Verificar duplicados por pregunta
          if (!options.skipDuplicates && existingQuestions.has(data.question.toLowerCase())) {
            result.errors.push({ row: rowIndex, message: `La pregunta ya existe` });
            continue;
          }

          if (options.skipDuplicates && existingQuestions.has(data.question.toLowerCase())) {
            result.warnings.push({ row: rowIndex, message: `Pregunta omitida (duplicado)` });
            continue;
          }

          // Crear FAQ
          await tx.fAQ.create({
            data: {
              id: crypto.randomUUID(),
              question: data.question,
              answer: data.answer,
              category: data.category,
              displayOrder: Number.parseInt(data.order || '0', 10),
              isActive: data.isActive === 'true',
              updatedAt: new Date(),
            },
          });

          result.imported++;
          existingQuestions.add(data.question.toLowerCase());
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            message: `Error al crear FAQ: ${(error as Error).message}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} FAQs importadas correctamente`
      : 'No se pudo importar ninguna FAQ';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando FAQs:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
