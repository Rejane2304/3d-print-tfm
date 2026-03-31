/**
 * API Route para catálogo de productos
 * GET /api/productos - Listado con filtros y paginación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { Categoria, Material } from '@prisma/client';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  
  // Parámetros de paginación
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
  const skip = (page - 1) * pageSize;
  
  // Parámetros de filtrado
  const categoria = searchParams.get('categoria') as Categoria | null;
  const material = searchParams.get('material') as Material | null;
  const minPrecio = searchParams.get('minPrecio');
  const maxPrecio = searchParams.get('maxPrecio');
  const enStock = searchParams.get('enStock') === 'true';
  const ordenar = searchParams.get('ordenar') || 'nombre';
  const orden = searchParams.get('orden') || 'asc';
  const busqueda = searchParams.get('busqueda');
  
  // Construir where clause
  const where: any = {
    activo: true,
  };
  
  if (categoria) {
    where.categoria = categoria;
  }
  
  if (material) {
    where.material = material;
  }
  
  if (minPrecio || maxPrecio) {
    where.precio = {};
    if (minPrecio) {
      where.precio.gte = parseFloat(minPrecio);
    }
    if (maxPrecio) {
      where.precio.lte = parseFloat(maxPrecio);
    }
  }
  
  if (enStock) {
    where.stock = { gt: 0 };
  }
  
  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { descripcion: { contains: busqueda, mode: 'insensitive' } },
    ];
  }
  
  // Construir orderBy
  const orderBy: any = {};
  if (ordenar === 'precio') {
    orderBy.precio = orden;
  } else if (ordenar === 'nombre') {
    orderBy.nombre = orden;
  } else if (ordenar === 'stock') {
    orderBy.stock = orden;
  }
  
  // Ejecutar queries en paralelo
  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        imagenes: {
          where: { esPrincipal: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.producto.count({ where }),
  ]);
  
  const totalPages = Math.ceil(total / pageSize);
  
  return NextResponse.json({
    success: true,
    data: productos,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      categoria,
      material,
      minPrecio,
      maxPrecio,
      enStock,
      ordenar,
      orden,
      busqueda,
    },
  });
});
