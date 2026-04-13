/**
 * Admin Product Detail API
 * GET, PUT, DELETE /api/admin/products/[identifier]
 *
 * Soporta tanto ID (UUID) como SLUG
 * Requires: ADMIN role
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Material } from '@prisma/client';
import {
  translateCategoryName,
  translateErrorMessage,
  translateProductDescription,
  translateProductName,
  translateProductShortDescription,
} from '@/lib/i18n';
import { unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Schema for image updates
const imageUpdateSchema = z.object({
  url: z.string().min(1),
  isMain: z.boolean().default(false),
});

// Validation schema for update
// Coerce converts strings to appropriate types
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  previousPrice: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  material: z.nativeEnum(Material).optional(),
  widthCm: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  depthCm: z.coerce.number().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  printTime: z.coerce.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(imageUpdateSchema).optional(),
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

  if (user?.role !== 'ADMIN') {
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
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = params;
    const product = await findProduct(identifier);

    if (!product) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    // Return translated data for admin panel
    // Use translation if available, otherwise use actual DB data
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      nombre: translateProductName(product.slug) || product.name,
      descripcion: translateProductDescription(product.slug) || product.description,
      descripcionCorta: translateProductShortDescription(product.slug) || product.shortDescription,
      precio: Number(product.price),
      precioAnterior: product.previousPrice ? Number(product.previousPrice) : null,
      stock: product.stock,
      minStock: product.minStock,
      categoryId: product.categoryId,
      categoria: product.category ? translateCategoryName(product.category.slug) : 'Sin categoría',
      material: product.material,
      anchoCm: product.widthCm,
      altoCm: product.heightCm,
      profundidadCm: product.depthCm,
      peso: product.weight,
      tiempoImpresion: product.printTime,
      activo: product.isActive,
      destacado: product.isFeatured,
      images: product.images.map(img => ({
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
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    // Generate new slug if name changed
    const newSlug = data.name
      ? data.name
          .normalize('NFD')
          .replaceAll(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, '-')
          .replaceAll(/(^-|-$)/g, '')
      : existingProduct.slug;

    // Update product and images in a transaction
    const updated = await prisma.$transaction(async tx => {
      // Update product data
      const productUpdateData: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        previousPrice: data.previousPrice ?? undefined,
        stock: data.stock,
        categoryId: data.categoryId,
        material: data.material,
        widthCm: data.widthCm ?? undefined,
        heightCm: data.heightCm ?? undefined,
        depthCm: data.depthCm ?? undefined,
        weight: data.weight ?? undefined,
        printTime: data.printTime ?? undefined,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        slug: newSlug,
      };

      const updatedProduct = await tx.product.update({
        where: { id: existingProduct.id },
        data: productUpdateData,
      });

      // Handle images update if provided
      if (data.images) {
        // Get current images
        const currentImages = await tx.productImage.findMany({
          where: { productId: existingProduct.id },
        });

        // Find images to delete (not in new list)
        const newImageUrls = new Set(data.images.map((img: { url: string }) => img.url));
        const imagesToDelete = currentImages.filter(img => !newImageUrls.has(img.url));

        // Delete removed images from filesystem
        for (const img of imagesToDelete) {
          try {
            const filePath = path.join(process.cwd(), 'public', img.url);
            if (existsSync(filePath)) {
              await unlink(filePath);
            }
          } catch (err) {
            console.error('Error deleting old image file:', err);
          }
        }

        // Delete all existing images from DB
        await tx.productImage.deleteMany({
          where: { productId: existingProduct.id },
        });

        // Create new images
        for (let i = 0; i < data.images.length; i++) {
          const img = data.images[i];
          await tx.productImage.create({
            data: {
              id: crypto.randomUUID(),
              product: { connect: { id: updatedProduct.id } },
              url: img.url,
              filename: img.url.split('/').pop() || 'image.jpg',
              isMain: img.isMain ?? i === 0,
              displayOrder: i,
              altText: data.name || existingProduct.name,
            },
          });
        }
      }

      // Return updated product with images
      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: { images: true, category: true },
      });
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    // Delete images from filesystem
    for (const image of existingProduct.images) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {
        // Error deleting image file; ignored intentionally
      }
    }

    // Delete product directory if exists
    try {
      const dirPath = path.join(process.cwd(), 'public', 'images', 'products', existingProduct.slug);
      if (existsSync(dirPath)) {
        const { rmdir } = await import('node:fs/promises');
        await rmdir(dirPath, { recursive: true });
      }
    } catch {
      // Error deleting product directory
    }

    // Delete product (cascades delete images from DB)
    await prisma.product.delete({
      where: { id: existingProduct.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
