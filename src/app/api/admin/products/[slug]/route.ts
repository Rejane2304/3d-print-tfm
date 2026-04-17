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

type UpdateProductData = z.infer<typeof updateProductSchema>;

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
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  const whereClause = isUUID ? { id: identifier } : { slug: identifier };

  return prisma.product.findUnique({
    where: whereClause,
    include: { images: true, category: true },
  });
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

// Build bilingual update data
function buildBilingualUpdateData(data: UpdateProductData): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  // Bilingual fields
  if (data.nameEs !== undefined) updateData.nameEs = data.nameEs;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.descriptionEs !== undefined) updateData.descriptionEs = data.descriptionEs;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
  if (data.shortDescEs !== undefined) updateData.shortDescEs = data.shortDescEs;
  if (data.shortDescEn !== undefined) updateData.shortDescEn = data.shortDescEn;
  if (data.metaTitleEs !== undefined) updateData.metaTitleEs = data.metaTitleEs;
  if (data.metaTitleEn !== undefined) updateData.metaTitleEn = data.metaTitleEn;
  if (data.metaDescEs !== undefined) updateData.metaDescEs = data.metaDescEs;
  if (data.metaDescEn !== undefined) updateData.metaDescEn = data.metaDescEn;

  // Legacy fields (update with Spanish values)
  if (data.nameEs !== undefined) updateData.name = data.nameEs;
  if (data.descriptionEs !== undefined) updateData.description = data.descriptionEs;
  if (data.shortDescEs !== undefined) updateData.shortDescription = data.shortDescEs;
  if (data.metaTitleEs !== undefined) updateData.metaTitle = data.metaTitleEs;
  if (data.metaDescEs !== undefined) updateData.metaDescription = data.metaDescEs;

  return updateData;
}

// Build non-bilingual update data
function buildStandardUpdateData(data: UpdateProductData): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  if (data.price !== undefined) updateData.price = data.price;
  if (data.previousPrice !== undefined) updateData.previousPrice = data.previousPrice ?? undefined;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.material !== undefined) updateData.material = data.material;
  if (data.widthCm !== undefined) updateData.widthCm = data.widthCm ?? undefined;
  if (data.heightCm !== undefined) updateData.heightCm = data.heightCm ?? undefined;
  if (data.depthCm !== undefined) updateData.depthCm = data.depthCm ?? undefined;
  if (data.weight !== undefined) updateData.weight = data.weight ?? undefined;
  if (data.printTime !== undefined) updateData.printTime = data.printTime ?? undefined;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

  return updateData;
}

// Build product update data
function buildProductUpdateData(data: UpdateProductData, existingSlug: string): Record<string, unknown> {
  const bilingualData = buildBilingualUpdateData(data);
  const standardData = buildStandardUpdateData(data);

  // Generate new slug if nameEs changed
  const newSlug = data.nameEs ? generateSlug(data.nameEs) : existingSlug;

  return {
    ...bilingualData,
    ...standardData,
    slug: newSlug,
  };
}

// Find images to delete
async function findImagesToDelete(
  tx: { productImage: { findMany: typeof prisma.productImage.findMany } },
  productId: string,
  newImages: Array<{ url: string }>,
): Promise<Array<{ url: string; filename: string; id: string }>> {
  const currentImages = await tx.productImage.findMany({
    where: { productId },
  });

  const newImageUrls = new Set(newImages.map(img => img.url));
  return currentImages.filter(img => !newImageUrls.has(img.url));
}

// Delete image files from filesystem
async function deleteImageFiles(
  imagesToDelete: Array<{ url: string; filename: string }>,
  productSlug: string,
): Promise<void> {
  for (const img of imagesToDelete) {
    try {
      const filename = img.url.split('/').pop() || img.filename;
      const filePath = path.join(process.cwd(), 'public', 'images', 'products', productSlug, filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (err) {
      console.error('Error deleting old image file:', err);
    }
  }
}

// Create new product images
async function createProductImages(
  tx: { productImage: { create: typeof prisma.productImage.create } },
  productId: string,
  images: Array<{ url: string; isMain?: boolean }>,
  productName: string,
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    await tx.productImage.create({
      data: {
        id: crypto.randomUUID(),
        product: { connect: { id: productId } },
        url: img.url,
        filename: img.url.split('/').pop() || 'image.jpg',
        isMain: img.isMain ?? i === 0,
        displayOrder: i,
        altText: productName,
      },
    });
  }
}

// Handle images update
async function handleImagesUpdate(
  tx: {
    productImage: {
      findMany: typeof prisma.productImage.findMany;
      deleteMany: typeof prisma.productImage.deleteMany;
      create: typeof prisma.productImage.create;
    };
  },
  productId: string,
  productSlug: string,
  images: Array<{ url: string; isMain?: boolean }>,
  productName: string,
): Promise<void> {
  // Find images to delete
  const imagesToDelete = await findImagesToDelete(tx, productId, images);

  // Delete removed images from filesystem
  await deleteImageFiles(imagesToDelete, productSlug);

  // Delete all existing images from DB
  await tx.productImage.deleteMany({
    where: { productId },
  });

  // Create new images
  await createProductImages(tx, productId, images, productName);
}

// Transform product for GET response
function transformProductForResponse(product: {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  shortDescEs: string | null;
  shortDescEn: string | null;
  metaTitleEs: string | null;
  metaTitleEn: string | null;
  metaDescEs: string | null;
  metaDescEn: string | null;
  price: unknown;
  previousPrice: unknown;
  stock: number;
  minStock: number;
  categoryId: string | null;
  category: { slug: string } | null;
  material: Material;
  widthCm: unknown;
  heightCm: unknown;
  depthCm: unknown;
  weight: unknown;
  printTime: number | null;
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; isMain: boolean; displayOrder: number }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
}

// Transform product for PUT response
function transformProductForPutResponse(product: {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  shortDescEs: string | null;
  shortDescEn: string | null;
  metaTitleEs: string | null;
  metaTitleEn: string | null;
  metaDescEs: string | null;
  metaDescEn: string | null;
  price: unknown;
  previousPrice: unknown;
  stock: number;
  categoryId: string | null;
  material: Material;
  widthCm: unknown;
  heightCm: unknown;
  depthCm: unknown;
  weight: unknown;
  printTime: number | null;
  isActive: boolean;
  isFeatured: boolean;
}) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.nameEs,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    description: product.descriptionEs,
    descriptionEs: product.descriptionEs,
    descriptionEn: product.descriptionEn,
    shortDesc: product.shortDescEs,
    shortDescEs: product.shortDescEs,
    shortDescEn: product.shortDescEn,
    metaTitleEs: product.metaTitleEs,
    metaTitleEn: product.metaTitleEn,
    metaDescEs: product.metaDescEs,
    metaDescEn: product.metaDescEn,
    price: Number(product.price),
    previousPrice: product.previousPrice ? Number(product.previousPrice) : null,
    stock: product.stock,
    material: product.material,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    depthCm: product.depthCm,
    weight: product.weight,
    printTime: product.printTime,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
  };
}

// GET - Get product by ID or slug
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = await params;
    const product = await findProduct(identifier);

    if (!product) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    const transformedProduct = transformProductForResponse(product);

    return NextResponse.json({ success: true, producto: transformedProduct });
  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = await params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    // Update product and images in a transaction
    const updated = await prisma.$transaction(async tx => {
      // Build update data
      const productUpdateData = buildProductUpdateData(data, existingProduct.slug);

      const updatedProduct = await tx.product.update({
        where: { id: existingProduct.id },
        data: productUpdateData,
      });

      // Handle images update if provided
      if (data.images) {
        const productName = data.nameEs || existingProduct.nameEs;
        await handleImagesUpdate(tx, existingProduct.id, existingProduct.slug, data.images, productName);
      }

      // Return updated product with images
      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: { images: true, category: true },
      });
    });

    const responseProduct = updated ? transformProductForPutResponse(updated) : null;

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
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await verifyAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = await params;
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
