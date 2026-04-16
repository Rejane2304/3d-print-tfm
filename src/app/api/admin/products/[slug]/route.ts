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
import { translateCategoryName, translateErrorMessage } from '@/lib/i18n';
import { unlink, rmdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Schema for image updates
const imageUpdateSchema = z.object({
  url: z.string().min(1),
  isMain: z.boolean().default(false),
});

// Validation schema for update with bilingual support
// Coerce converts strings to appropriate types
const updateProductSchema = z.object({
  // Bilingual fields - required
  nameEs: z.string().min(2, 'El nombre en español debe tener al menos 2 caracteres').optional(),
  nameEn: z.string().min(2, 'El nombre en inglés debe tener al menos 2 caracteres').optional(),
  descriptionEs: z.string().min(10, 'La descripción en español debe tener al menos 10 caracteres').optional(),
  descriptionEn: z.string().min(10, 'La descripción en inglés debe tener al menos 10 caracteres').optional(),
  // Bilingual fields - optional
  shortDescEs: z.string().max(255, 'La descripción corta no puede exceder 255 caracteres').optional(),
  shortDescEn: z.string().max(255, 'La descripción corta no puede exceder 255 caracteres').optional(),
  metaTitleEs: z.string().max(200, 'El meta título no puede exceder 200 caracteres').optional(),
  metaTitleEn: z.string().max(200, 'El meta título no puede exceder 200 caracteres').optional(),
  metaDescEs: z.string().max(300, 'La meta descripción no puede exceder 300 caracteres').optional(),
  metaDescEn: z.string().max(300, 'La meta descripción no puede exceder 300 caracteres').optional(),
  // Other fields
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

    // Return product with Spanish fields for admin panel
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      // Spanish version for UI
      nombre: product.nameEs,
      descripcion: product.descriptionEs,
      descripcionCorta: product.shortDescEs,
      // Bilingual fields
      nameEs: product.nameEs,
      nameEn: product.nameEn,
      descriptionEs: product.descriptionEs,
      descriptionEn: product.descriptionEn,
      shortDescEs: product.shortDescEs,
      shortDescEn: product.shortDescEn,
      metaTitleEs: product.metaTitleEs,
      metaTitleEn: product.metaTitleEn,
      metaDescEs: product.metaDescEs,
      metaDescEn: product.metaDescEn,
      // Other fields
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

    // Generate new slug if nameEs changed (using Spanish name as canonical)
    const newSlug = data.nameEs
      ? data.nameEs
          .normalize('NFD')
          .replaceAll(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, '-')
          .replaceAll(/(^-|-$)/g, '')
      : existingProduct.slug;

    // Update product and images in a transaction
    const updated = await prisma.$transaction(async tx => {
      // Update product data with bilingual fields
      const productUpdateData: Record<string, unknown> = {
        // Bilingual fields
        ...(data.nameEs !== undefined && { nameEs: data.nameEs }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.descriptionEs !== undefined && { descriptionEs: data.descriptionEs }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
        ...(data.shortDescEs !== undefined && { shortDescEs: data.shortDescEs }),
        ...(data.shortDescEn !== undefined && { shortDescEn: data.shortDescEn }),
        ...(data.metaTitleEs !== undefined && { metaTitleEs: data.metaTitleEs }),
        ...(data.metaTitleEn !== undefined && { metaTitleEn: data.metaTitleEn }),
        ...(data.metaDescEs !== undefined && { metaDescEs: data.metaDescEs }),
        ...(data.metaDescEn !== undefined && { metaDescEn: data.metaDescEn }),
        // Legacy fields (update with Spanish values)
        ...(data.nameEs !== undefined && { name: data.nameEs }),
        ...(data.descriptionEs !== undefined && { description: data.descriptionEs }),
        ...(data.shortDescEs !== undefined && { shortDescription: data.shortDescEs }),
        ...(data.metaTitleEs !== undefined && { metaTitle: data.metaTitleEs }),
        ...(data.metaDescEs !== undefined && { metaDescription: data.metaDescEs }),
        // Other fields
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
            const filename = img.url.split('/').pop() || img.filename;
            const filePath = path.join(process.cwd(), 'public', 'images', 'products', existingProduct.slug, filename);
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
              altText: data.nameEs || existingProduct.nameEs,
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

    // Return updated product with Spanish fields for UI
    const responseProduct = updated
      ? {
          id: updated.id,
          slug: updated.slug,
          name: updated.nameEs,
          nameEs: updated.nameEs,
          nameEn: updated.nameEn,
          description: updated.descriptionEs,
          descriptionEs: updated.descriptionEs,
          descriptionEn: updated.descriptionEn,
          shortDesc: updated.shortDescEs,
          shortDescEs: updated.shortDescEs,
          shortDescEn: updated.shortDescEn,
          metaTitleEs: updated.metaTitleEs,
          metaTitleEn: updated.metaTitleEn,
          metaDescEs: updated.metaDescEs,
          metaDescEn: updated.metaDescEn,
          price: Number(updated.price),
          previousPrice: updated.previousPrice ? Number(updated.previousPrice) : null,
          stock: updated.stock,
          material: updated.material,
          widthCm: updated.widthCm,
          heightCm: updated.heightCm,
          depthCm: updated.depthCm,
          weight: updated.weight,
          printTime: updated.printTime,
          isActive: updated.isActive,
          isFeatured: updated.isFeatured,
          categoryId: updated.categoryId,
        }
      : null;

    return NextResponse.json({ success: true, product: responseProduct });
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

    // Delete product directory if exists (includes all images)
    try {
      const dirPath = path.join(process.cwd(), 'public', 'images', 'products', existingProduct.slug);
      if (existsSync(dirPath)) {
        await rmdir(dirPath, { recursive: true });
      }
    } catch {
      // Directory doesn't exist or error deleting, no action needed
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
