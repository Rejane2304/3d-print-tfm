/**
 * API de Categoría Individual Admin
 * CRUD de una categoría específica
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import {
  translateCategoryDescription,
  translateCategoryName,
} from '@/lib/i18n';

// Schema de validación
const categoryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres')
    .optional(),
  slug: z
    .string()
    .min(1, 'El slug es obligatorio')
    .max(100, 'Máximo 100 caracteres')
    .optional(),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  image: z.string().max(500, 'URL muy larga').optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Helper: Verificar autenticación y autorización admin
async function verifyAdminAuth(): Promise<NextResponse | null> {
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

  return null;
}

// Helper: Traducir categoría al español
function translateCategory(category: {
  id: string;
  slug: string;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number };
}) {
  return {
    id: category.id,
    _ref: category.id.slice(0, 8).toUpperCase(),
    nombre: translateCategoryName(category.slug),
    slug: category.slug,
    descripcion: translateCategoryDescription(category.slug),
    imagen: category.image,
    ordenVisualizacion: category.displayOrder,
    activo: category.isActive,
    totalProductos: category._count.products,
    creadoEn: category.createdAt,
    actualizadoEn: category.updatedAt,
  };
}

// GET - Obtener categoría
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      categoria: translateCategory(category),
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// Helper: Verificar que la categoría existe
async function getCategoryOr404(id: string): Promise<
  | NextResponse
  | { id: string; slug: string; name: string | null; description: string | null }
> {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    return NextResponse.json(
      { success: false, error: 'Categoría no encontrada' },
      { status: 404 },
    );
  }

  return category;
}

// PATCH - Actualizar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const existing = await getCategoryOr404(id);
    if (existing instanceof NextResponse) {
      return existing;
    }

    const body = await request.json();
    const data = categoryUpdateSchema.parse(body);

    // Si se está actualizando el slug, verificar que sea único
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una categoría con ese slug' },
          { status: 400 },
        );
      }
    }

    // Actualizar categoría
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const authError = await verifyAdminAuth();
    if (authError) {
      return authError;
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 },
      );
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar una categoría con productos asociados',
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 },
    );
  }
}
