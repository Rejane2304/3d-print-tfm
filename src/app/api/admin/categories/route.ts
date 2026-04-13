/**
 * API de Categorías Admin
 * CRUD de categorías para administradores
 *
 * Requiere: Rol ADMIN
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { translateCategoryDescription, translateCategoryName } from '@/lib/i18n';

// Schema de validación
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  slug: z.string().min(1, 'El slug es obligatorio').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  image: z.string().max(500, 'URL muy larga').optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET - Listar categorías
export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Translate categories to Spanish for admin panel
    const categoriasTraducidas = categories.map(category => ({
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
    }));

    return NextResponse.json({
      success: true,
      categorias: categoriasTraducidas,
    });
  } catch (error) {
    console.error('Error listando categorías:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear categoría
export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const data = categorySchema.parse(body);

    // Verificar slug único
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe una categoría con ese slug' }, { status: 400 });
    }

    // Crear categoría
    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creando categoría:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
