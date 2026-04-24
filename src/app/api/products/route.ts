export const dynamic = 'force-dynamic';

/**
 * API Route para catálogo de productos
 * GET /api/products - Listado con filtros y paginación
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Material, Prisma } from '@prisma/client';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import {
  translateCategoryName,
  translateProductDescription,
  translateProductName,
  translateProductShortDescription,
} from '@/lib/i18n';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  // Pagination parameters
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '12', 10);
  const skip = (page - 1) * pageSize;

  // Filter parameters
  const categorySlug = searchParams.get('category') || searchParams.get('categoria');
  const material = searchParams.get('material') as Material | null;
  const minPrice = searchParams.get('minPrice') || searchParams.get('minPrecio');
  const maxPrice = searchParams.get('maxPrice') || searchParams.get('maxPrecio');
  const inStock = (searchParams.get('inStock') || searchParams.get('enStock')) === 'true';
  const sortBy = searchParams.get('sortBy') || searchParams.get('ordenar') || 'name';
  const sortOrder = searchParams.get('sortOrder') || searchParams.get('orden') || 'asc';
  const search = searchParams.get('search') || searchParams.get('busqueda');

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  // If category slug provided, look up category and filter by categoryId
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (category) {
      where.categoryId = category.id;
    }
  }

  if (material) {
    where.material = material;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = Number.parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = Number.parseFloat(maxPrice);
    }
  }

  if (inStock) {
    where.stock = { gt: 0 };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      {
        description: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      },
      // Also search in bilingual fields
      { nameEs: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      { nameEn: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      { descriptionEs: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      { descriptionEn: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
    ];
  }

  // Build orderBy
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  // Only order in DB for price and stock. Name ordering is done after translation.
  if (sortBy === 'price' || sortBy === 'precio') {
    orderBy.price = sortOrder as Prisma.SortOrder;
  } else if (sortBy === 'stock') {
    orderBy.stock = sortOrder as Prisma.SortOrder;
  }
  // Name ordering is handled after translation

  // Execute queries in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Translate products to Spanish
  const translatedProducts = products.map(product => ({
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    shortDescription: translateProductShortDescription(product.slug),
    category: product.category
      ? {
          ...product.category,
          name: translateCategoryName(product.category.slug),
        }
      : product.category,
  }));

  // Sort by name after translation if requested
  const sortedProducts = [...translatedProducts].sort((a, b) => {
    if (sortBy === 'name' || sortBy === 'nombre') {
      const comparison = (a.name || '').localeCompare(b.name || '', 'es', {
        sensitivity: 'base',
      });
      return sortOrder === 'desc' ? -comparison : comparison;
    }
    return 0;
  });

  const response = NextResponse.json({
    success: true,
    data: sortedProducts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      category: categorySlug,
      material,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
      search,
    },
  });

  // CRITICAL: Disconnect to free up connection pool
  await prisma.$disconnect();

  return response;
});
