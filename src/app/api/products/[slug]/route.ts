/**
 * API Route for product detail
 * GET /api/products/[slug] - Get product by slug
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ApiError, ErrorCode } from '@/lib/errors';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import {
  translateCategoryDescription,
  translateCategoryName,
  translateProductDescription,
  translateProductName,
  translateProductShortDescription,
} from '@/lib/i18n';

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  if (!slug) {
    throw new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, 'El identificador del producto es requerido', 400);
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
    throw new ApiError(ErrorCode.DB_NOT_FOUND, 'Producto no encontrado', 404);
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

  // Get related products (same category, excluding current)
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
  const translatedRelated = related.map(p => ({
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
