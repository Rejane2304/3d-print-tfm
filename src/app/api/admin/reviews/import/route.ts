/**
 * API de Importación CSV de Reseñas
 * POST /api/admin/reviews/import
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
const REQUIRED_COLUMNS = ['productId', 'userEmail', 'rating', 'title', 'comment'];

interface ImportRow {
  productId: string;
  userEmail: string;
  rating: string;
  title: string;
  comment: string;
  isVerified?: string;
  isApproved?: string;
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

  const productId = String(row.productId || row.productSlug || '').trim();
  if (!productId) errors.push('El ID o slug del producto es obligatorio');

  const userEmail = String(row.userEmail || '').trim();
  if (!userEmail) {
    errors.push('El email del usuario es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    errors.push('El email del usuario no es válido');
  }

  const rating = Number.parseInt(String(row.rating || '0'), 10);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('La puntuación debe ser un número entre 1 y 5');
  }

  const title = String(row.title || '').trim();
  if (!title) errors.push('El título es obligatorio');
  if (title.length > 200) errors.push('El título no puede tener más de 200 caracteres');

  const comment = String(row.comment || '').trim();
  if (!comment) errors.push('El comentario es obligatorio');

  // Opcional: verificado
  const isVerified = String(row.isVerified || 'false').toLowerCase() === 'true';

  // Opcional: aprobado
  const isApproved = String(row.isApproved || 'false').toLowerCase() === 'true';

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors,
    warnings,
    data: {
      productId,
      userEmail,
      rating: String(rating),
      title,
      comment,
      isVerified: String(isVerified),
      isApproved: String(isApproved),
    },
  };
}

// POST - Importar reseñas desde CSV
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
    const missingColumns = REQUIRED_COLUMNS.filter(
      col => !(col in firstRow) && !(col === 'productId' && 'productSlug' in firstRow),
    );
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

    // Obtener productos y usuarios existentes
    const [products, users] = await Promise.all([
      prisma.product.findMany({ select: { id: true, slug: true } }),
      prisma.user.findMany({ select: { id: true, email: true } }),
    ]);

    // Crear mapas para búsqueda
    const productMap = new Map<string, string>(); // slug -> id
    products.forEach(p => {
      productMap.set(p.slug.toLowerCase(), p.id);
      productMap.set(p.id.toLowerCase(), p.id);
    });

    const userMap = new Map<string, string>(); // email -> id
    users.forEach(u => {
      userMap.set(u.email.toLowerCase(), u.id);
    });

    // Validar todas las filas
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

    // Verificar duplicados existentes
    const existingReviews = await prisma.review.findMany({
      select: { productId: true, userId: true },
    });
    const existingPairs = new Set(existingReviews.map(r => `${r.productId}|${r.userId}`));

    // Importar en transacción
    await prisma.$transaction(async tx => {
      for (const { data, rowIndex } of validRows) {
        try {
          // Buscar producto
          const productId = productMap.get(data.productId.toLowerCase());
          if (!productId) {
            result.errors.push({ row: rowIndex, message: `Producto '${data.productId}' no encontrado` });
            continue;
          }

          // Buscar o crear usuario
          let userId = userMap.get(data.userEmail.toLowerCase());

          if (!userId && options.createMissingUsers) {
            // Crear usuario
            const newUser = await tx.user.create({
              data: {
                id: crypto.randomUUID(),
                email: data.userEmail,
                name: data.userEmail.split('@')[0] || 'Usuario',
                password: crypto.randomUUID(), // Password temporal
                role: 'CUSTOMER',
              },
            });
            userId = newUser.id;
            if (userId) {
              userMap.set(data.userEmail.toLowerCase(), userId);
            }
            result.warnings.push({ row: rowIndex, message: `Usuario '${data.userEmail}' creado automáticamente` });
          }

          if (!userId) {
            result.errors.push({ row: rowIndex, message: `Usuario '${data.userEmail}' no encontrado` });
            continue;
          }

          // Verificar duplicado
          const pairKey = `${productId}|${userId}`;
          if (existingPairs.has(pairKey)) {
            if (options.skipDuplicates) {
              result.warnings.push({ row: rowIndex, message: `Reseña duplicada omitida` });
            } else {
              result.errors.push({ row: rowIndex, message: `El usuario ya tiene una reseña para este producto` });
            }
            continue;
          }

          // Crear reseña
          await tx.review.create({
            data: {
              id: crypto.randomUUID(),
              productId,
              userId,
              rating: Number.parseInt(data.rating, 10),
              title: data.title,
              comment: data.comment,
              isVerified: data.isVerified === 'true',
              isApproved: data.isApproved === 'true',
            },
          });

          result.imported++;
          existingPairs.add(pairKey);
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            message: `Error al crear reseña: ${(error as Error).message}`,
          });
        }
      }
    });

    result.success = result.imported > 0;
    result.message = result.success
      ? `${result.imported} reseñas importadas correctamente`
      : 'No se pudo importar ninguna reseña';

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importando reseñas:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Error al procesar la importación') },
      { status: 500 },
    );
  }
}
