/**
 * Admin Product Detail API
 * GET, PUT, DELETE /api/admin/products/[identifier]
 * 
 * Soporta tanto ID (UUID) como SLUG
 * Requires: ADMIN role
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Material } from '@prisma/client';
import {
  translateProductName,
  translateProductDescription,
  translateProductShortDescription,
  translateCategoryName,
  translateErrorMessage,
} from '@/lib/i18n';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Validation schema for update
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

// Helper to verify admin authentication
async function verifyAdminAuth() {
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

  return { user };
}

// Helper to find product by ID or slug
async function findProduct(identifier: string) {
  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  if (isUUID) {
    return await prisma.product.findUnique({
      where: { id: identifier },
      include: { images: true, category: true },
    });
  } else {
    return await prisma.product.findUnique({
      where: { slug: identifier },
      include: { images: true, category: true },
    });
  }
}

// GET - Get product by ID or slug
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { slug: identifier } = params;
    const product = await findProduct(identifier);

    if (!product) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    // Return translated data for admin panel
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      name: translateProductName(product.slug),
      description: translateProductDescription(product.slug),
      shortDescription: translateProductShortDescription(product.slug),
      price: Number(product.price),
      previousPrice: product.previousPrice ? Number(product.previousPrice) : null,
      stock: product.stock,
      minStock: product.minStock,
      categoryId: product.categoryId,
      category: product.category ? translateCategoryName(product.category.slug) : 'Sin categoría',
      material: product.material,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
      depthCm: product.depthCm,
      weight: product.weight,
      printTime: product.printTime,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        isMain: img.isMain,
        displayOrder: img.displayOrder,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ success: true, producto: transformedProduct });
  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { slug: identifier } = params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    // Generate new slug if name changed
    const newSlug = data.name
      ? data.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : existingProduct.slug;

    // Update product
    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        ...data,
        slug: newSlug,
        previousPrice: data.previousPrice ?? undefined,
        widthCm: data.widthCm ?? undefined,
        heightCm: data.heightCm ?? undefined,
        depthCm: data.depthCm ?? undefined,
        weight: data.weight ?? undefined,
        printTime: data.printTime ?? undefined,
      },
      include: { images: true, category: true },
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

// DELETE - Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { slug: identifier } = params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    // Delete images from filesystem
    for (const image of existingProduct.images) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (err) {
        console.warn('Error deleting image file:', err);
      }
    }

    // Delete product directory if exists
    try {
      const dirPath = path.join(process.cwd(), 'public', 'images', 'products', existingProduct.slug);
      if (existsSync(dirPath)) {
        const { rmdir } = await import('fs/promises');
        await rmdir(dirPath, { recursive: true });
      }
    } catch (err) {
      console.warn('Error deleting product directory:', err);
    }

    // Delete product (cascades delete images from DB)
    await prisma.product.delete({
      where: { id: existingProduct.id },
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
