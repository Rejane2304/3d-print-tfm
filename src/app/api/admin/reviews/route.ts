/**
 * API de Reseñas Admin
 * Listar todas las reseñas para administradores
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { translateProductName } from '@/lib/i18n';

// GET - Listar todas las reseñas
export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 },
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const productFilter = searchParams.get('product');
    const ratingFilter = searchParams.get('rating');
    const verifiedFilter = searchParams.get('verified');

    const where: Record<string, unknown> = {};

    if (ratingFilter) {
      where.rating = Number.parseInt(ratingFilter);
    }

    if (verifiedFilter === 'true') {
      where.isVerified = true;
    } else if (verifiedFilter === 'false') {
      where.isVerified = false;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by product name if provided (after translation)
    let filteredReviews = reviews;
    if (productFilter) {
      filteredReviews = reviews.filter((review) => {
        const productName = translateProductName(
          review.product.slug,
        ).toLowerCase();
        return productName.includes(productFilter.toLowerCase());
      });
    }

    // Formatear para el panel admin (español)
    const resenasFormateadas = filteredReviews.map((review) => ({
      id: review.id,
      _ref: review.id.slice(0, 8).toUpperCase(),
      productoId: review.productId,
      productoNombre: translateProductName(review.product.slug),
      productoSlug: review.product.slug,
      usuarioId: review.userId,
      usuarioNombre: review.user.name,
      usuarioEmail: review.user.email,
      puntuacion: review.rating,
      titulo: review.title,
      comentario: review.comment,
      verificado: review.isVerified,
      aprobado: review.isApproved,
      creadoEn: review.createdAt,
      actualizadoEn: review.updatedAt,
    }));

    return NextResponse.json({ success: true, resenas: resenasFormateadas });
  } catch (error) {
    console.error('Error listando reseñas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// DELETE - Bulk delete reviews
export async function DELETE(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs de reseñas requeridos' },
        { status: 400 },
      );
    }

    // Delete reviews
    await prisma.review.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${ids.length} reseñas eliminadas`,
    });
  } catch (error) {
    console.error('Error eliminando reseñas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}
