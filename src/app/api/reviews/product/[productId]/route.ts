/**
 * API de Reseñas por Producto
 * Obtener reseñas públicas de un producto específico
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - Obtener reseñas de un producto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // Get query params for pagination and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, oldest, highest, lowest

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Construir orden
    let orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Obtener reseñas aprobadas
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Contar total de reseñas para paginación
    const totalCount = await prisma.review.count({
      where: {
        productId,
        isApproved: true,
      },
    });

    // Calcular estadísticas de reseñas
    const allReviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    
    allReviews.forEach(review => {
      ratingCounts[review.rating as 1 | 2 | 3 | 4 | 5]++;
      totalRating += review.rating;
    });

    const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

    // Formatear reseñas para el frontend
    const resenasFormateadas = reviews.map((review) => ({
      id: review.id,
      usuarioNombre: review.user.name,
      puntuacion: review.rating,
      titulo: review.title,
      comentario: review.comment,
      verificado: review.isVerified,
      creadoEn: review.createdAt,
    }));

    return NextResponse.json({
      success: true,
      resenas: resenasFormateadas,
      estadisticas: {
        promedio: Number(averageRating.toFixed(1)),
        total: totalCount,
        distribucion: ratingCounts,
      },
      paginacion: {
        pagina: page,
        porPagina: limit,
        totalPaginas: Math.ceil(totalCount / limit),
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
