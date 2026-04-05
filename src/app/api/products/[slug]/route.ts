/**
 * API Route para detalle de producto
 * GET /api/products/[slug] - Obtener producto por slug
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { ApiError, ErrorCode } from '@/lib/errors';
import {
  translateProductName,
  translateProductDescription,
  translateProductShortDescription,
  translateCategoryName,
  translateCategoryDescription,
} from '@/lib/i18n';

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { slug: string } }
) => {
  const { slug } = params;
  
  if (!slug) {
    throw new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, 'Slug is required', 400);
  }
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      category: true,
    },
  });

  if (!product) {
    throw new ApiError(ErrorCode.DB_NOT_FOUND, 'Producto not found', 404);
  }

  if (!product.isActive) {
    throw new ApiError(ErrorCode.DB_NOT_FOUND, 'Producto no disponible', 404);
  }

  // Translate product fields to Spanish
  const translatedProduct = {
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    shortDescription: translateProductShortDescription(product.slug),
    category: product.category
      ? {
          ...product.category,
          name: translateCategoryName(product.category.slug),
          description: translateCategoryDescription(product.category.slug),
        }
      : product.category,
  };

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

  // Translate related products
  const translatedRelated = related.map((p) => ({
    ...p,
    name: translateProductName(p.slug),
    description: translateProductDescription(p.slug),
    shortDescription: translateProductShortDescription(p.slug),
  }));

  return NextResponse.json({
    success: true,
    data: {
      product: translatedProduct,
      related: translatedRelated,
    },
  });
});
