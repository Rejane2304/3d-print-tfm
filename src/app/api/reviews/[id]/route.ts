/**
 * API de Reseña Individual
 * Actualizar o eliminar la reseña propia del usuario
 * 
 * Requiere: Autenticación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Schema de validación
const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5, 'La puntuación debe estar entre 1 y 5').optional(),
  title: z.string().min(1, 'El título es obligatorio').max(200, 'Máximo 200 caracteres').optional(),
  comment: z.string().min(1, 'El comentario es obligatorio').max(2000, 'Máximo 2000 caracteres').optional(),
});

// GET - Obtener reseña propia del usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Si el id es 'my-review', buscar por productId en query params
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let review;
    if (id === 'my-review' && productId) {
      review = await prisma.review.findUnique({
        where: {
          productId_userId: {
            productId,
            userId: user.id,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Buscar reseña por ID
      review = await prisma.review.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reseña pertenece al usuario (a menos que sea admin)
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        productoId: review.productId,
        productoNombre: review.product.name,
        puntuacion: review.rating,
        titulo: review.title,
        comentario: review.comment,
        verificado: review.isVerified,
        aprobado: review.isApproved,
        creadoEn: review.createdAt,
        actualizadoEn: review.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error obteniendo reseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar reseña propia
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verificar que la reseña existe
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reseña pertenece al usuario
    if (existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = reviewUpdateSchema.parse(body);

    // Actualizar reseña
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title && { title: data.title }),
        ...(data.comment && { comment: data.comment }),
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

    return NextResponse.json({ success: true, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando reseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar reseña propia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verificar que la reseña existe
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reseña pertenece al usuario (o es admin)
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Eliminar reseña
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Reseña eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando reseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
