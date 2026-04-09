/**
 * Admin Product Detail API
 * GET, PUT, DELETE /api/admin/products/[id]
 * 
 * Requires: ADMIN role
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Material } from '@prisma/client';
import { translateErrorMessage } from '@/lib/i18n';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Schema de validación para actualización
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive().optional(),
  previousPrice: z.number().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  material: z.nativeEnum(Material).optional(),
  widthCm: z.number().optional().nullable(),
  heightCm: z.number().optional().nullable(),
  depthCm: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  printTime: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// Verificar autenticación
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'No autenticado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'No autorizado', status: 403 };
  }

  return null;
}

// GET - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await checkAuth();
    if (authError) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage(authError.error) },
        { status: authError.status }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await checkAuth();
    if (authError) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage(authError.error) },
        { status: authError.status }
      );
    }

    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar producto
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        previousPrice: data.previousPrice ?? undefined,
        widthCm: data.widthCm ?? undefined,
        heightCm: data.heightCm ?? undefined,
        depthCm: data.depthCm ?? undefined,
        weight: data.weight ?? undefined,
        printTime: data.printTime ?? undefined,
      },
      include: {
        images: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await checkAuth();
    if (authError) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage(authError.error) },
        { status: authError.status }
      );
    }

    // Obtener producto con imágenes antes de borrar
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar imágenes del sistema de archivos
    for (const image of product.images) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (err) {
        console.warn('Error deleting image file:', err);
      }
    }

    // Eliminar directorio del producto si existe
    try {
      const dirPath = path.join(process.cwd(), 'public', 'images', 'products', product.slug);
      if (existsSync(dirPath)) {
        const { rmdir } = await import('fs/promises');
        await rmdir(dirPath, { recursive: true });
      }
    } catch (err) {
      console.warn('Error deleting product directory:', err);
    }

    // Eliminar producto (cascada elimina imágenes de la BD)
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}
