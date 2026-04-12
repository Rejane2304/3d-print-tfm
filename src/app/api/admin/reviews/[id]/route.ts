/**
 * API de Reseña Individual Admin
 * Actualizar o eliminar una reseña específica
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Schema de validación
const reviewUpdateSchema = z.object({
  isVerified: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

// PATCH - Actualizar reseña
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    // Verificar que la reseña existe
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = reviewUpdateSchema.parse(body);

    // Actualizar reseña
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
      },
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
    });

    // Formatear reseña para el frontend (español)
    const resenaFormateada = {
      id: review.id,
      usuarioNombre: review.user.name,
      usuarioEmail: review.user.email,
      productoId: review.productId,
      productoNombre: review.product.name,
      puntuacion: review.rating,
      titulo: review.title,
      comentario: review.comment,
      verificado: review.isVerified,
      aprobado: review.isApproved,
      creadoEn: review.createdAt,
    };

    return NextResponse.json({ success: true, resena: resenaFormateada });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('Error actualizando reseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar reseña
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    // Verificar que la reseña existe
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 },
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
      { status: 500 },
    );
  }
}
