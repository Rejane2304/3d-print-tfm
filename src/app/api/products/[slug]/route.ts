/**
 * API Route para detalle de producto
 * GET /api/products/[slug] - Obtener producto por slug
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { ApiError, ErrorCode } from '@/lib/errors';

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { slug: string } }
) => {
  const { slug } = params;
  
  if (!slug) {
    throw new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, 'Slug es requerido', 400);
  }
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });
  
  if (!product) {
    throw new ApiError(ErrorCode.DB_NOT_FOUND, 'Producto no encontrado', 404);
  }
  
  if (!product.isActive) {
    throw new ApiError(ErrorCode.DB_NOT_FOUND, 'Producto no disponible', 404);
  }
  
  // Obtener productos relacionados (misma categoría, excluyendo el actual)
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: {
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
    take: 4,
  });
  
  return NextResponse.json({
    success: true,
    data: {
      product,
      related,
    },
  });
});
