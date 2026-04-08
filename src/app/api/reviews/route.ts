/**
 * API de Reseñas Públicas
 * Crear reseña (usuarios autenticados)
 * 
 * Requiere: Autenticación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { createNegativeReviewAlert } from '@/lib/alerts/alert-service';

// Schema de validación
const reviewCreateSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  rating: z.number().int().min(1).max(5, 'La puntuación debe estar entre 1 y 5'),
  title: z.string().min(1, 'El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  comment: z.string().min(1, 'El comentario es obligatorio').max(2000, 'Máximo 2000 caracteres'),
});

// GET - Obtener reseñas del usuario autenticado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// POST - Crear reseña
export async function POST(req: NextRequest) {
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
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = reviewCreateSchema.parse(body);

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no haya dejado ya una reseña para este producto
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: data.productId,
          userId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Ya has dejado una reseña para este producto' },
        { status: 400 }
      );
    }

    // Opcional: Verificar que el usuario haya comprado el producto
    // (esto podría habilitar la verificación automática)
    const hasOrdered = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'DELIVERED',
        items: {
          some: {
            productId: data.productId,
          },
        },
      },
    });

    // Crear reseña
    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        userId: user.id,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: !!hasOrdered,
        isApproved: true, // Auto-aprobar por defecto
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Crear alerta para reseñas negativas (1-2 estrellas)
    if (data.rating <= 2) {
      try {
        await createNegativeReviewAlert(review.id);
      } catch (alertError) {
        console.error('Error creating negative review alert:', alertError);
      }
    }

    // Formatear reseña para el frontend (español)
    const resenaFormateada = {
      id: review.id,
      usuarioNombre: review.user.name,
      puntuacion: review.rating,
      titulo: review.title,
      comentario: review.comment,
      verificado: review.isVerified,
      creadoEn: review.createdAt,
    };

    return NextResponse.json(
      { success: true, resena: resenaFormateada },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando reseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
