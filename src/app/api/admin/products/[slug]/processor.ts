/**
 * Product Update Processor
 * Contains all logic for updating a product
 */
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Material } from '@prisma/client';
import { translateErrorMessage } from '@/lib/i18n';
import { unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

interface ImageUpdate {
  url: string;
  isMain?: boolean;
}

const imageUpdateSchema = z.object({
  url: z.string().min(1),
  isMain: z.boolean().default(false),
});

const updateProductSchema = z.object({
  nameEs: z.string().min(2).optional(),
  nameEn: z.string().min(2).optional(),
  descriptionEs: z.string().min(10).optional(),
  descriptionEn: z.string().min(10).optional(),
  shortDescEs: z.string().max(255).optional(),
  shortDescEn: z.string().max(255).optional(),
  metaTitleEs: z.string().max(200).optional(),
  metaTitleEn: z.string().max(200).optional(),
  metaDescEs: z.string().max(300).optional(),
  metaDescEn: z.string().max(300).optional(),
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

export type UpdateProductData = z.infer<typeof updateProductSchema>;

// Authentication
export async function verifyAdminAuth(): Promise<{ user?: { id: string }; error?: string; status?: number }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'No autenticado', status: 401 };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (user?.role !== 'ADMIN') return { error: 'No autorizado', status: 403 };

  return { user };
}

// Find product by ID or slug
export async function findProduct(identifier: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const whereClause = isUUID ? { id: identifier } : { slug: identifier };

  return prisma.product.findUnique({ where: whereClause, include: { images: true, category: true } });
}

// Generate slug
export function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Build bilingual update data
function buildBilingualUpdateData(data: UpdateProductData): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

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

  if (data.nameEs !== undefined) updateData.name = data.nameEs;
  if (data.descriptionEs !== undefined) updateData.description = data.descriptionEs;
  if (data.shortDescEs !== undefined) updateData.shortDescription = data.shortDescEs;
  if (data.metaTitleEs !== undefined) updateData.metaTitle = data.metaTitleEs;
  if (data.metaDescEs !== undefined) updateData.metaDescription = data.metaDescEs;

  return updateData;
}

// Build standard update data
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

// Build complete product update data
export function buildProductUpdateData(data: UpdateProductData, existingSlug: string): Record<string, unknown> {
  const bilingualData = buildBilingualUpdateData(data);
  const standardData = buildStandardUpdateData(data);
  const newSlug = data.nameEs ? generateSlug(data.nameEs) : existingSlug;

  return { ...bilingualData, ...standardData, slug: newSlug };
}

// Find images to delete
async function findImagesToDelete(
  tx: { productImage: { findMany: typeof prisma.productImage.findMany } },
  productId: string,
  newImages: Array<{ url: string }>,
): Promise<Array<{ url: string; filename: string; id: string }>> {
  const currentImages = await tx.productImage.findMany({ where: { productId } });
  const newImageUrls = new Set(newImages.map(img => img.url));
  return currentImages.filter(img => !newImageUrls.has(img.url));
}

// Delete image files
async function deleteImageFiles(imagesToDelete: Array<{ url: string }>, productSlug: string): Promise<void> {
  for (const img of imagesToDelete) {
    try {
      const filename = img.url.split('/').pop();
      if (!filename) continue;
      const filePath = path.join(process.cwd(), 'public', 'images', 'products', productSlug, filename);
      if (existsSync(filePath)) await unlink(filePath);
    } catch (err) {
      console.error('Error deleting old image file:', err);
    }
  }
}

// Create product images
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
export async function handleImagesUpdate(
  tx: {
    productImage: {
      findMany: typeof prisma.productImage.findMany;
      deleteMany: typeof prisma.productImage.deleteMany;
      create: typeof prisma.productImage.create;
    };
  },
  productId: string,
  productSlug: string,
  images: ImageUpdate[],
  productName: string,
): Promise<void> {
  const imagesToDelete = await findImagesToDelete(tx, productId, images);
  await deleteImageFiles(imagesToDelete, productSlug);
  await tx.productImage.deleteMany({ where: { productId } });
  await createProductImages(tx, productId, images, productName);
}

// Transform product for PUT response
export function transformProductForPutResponse(product: {
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

// Update product in transaction
export async function updateProductTransaction(
  existingProduct: { id: string; slug: string; nameEs: string },
  data: UpdateProductData,
): Promise<unknown> {
  return prisma.$transaction(async tx => {
    const updateData = buildProductUpdateData(data, existingProduct.slug);

    const updated = await tx.product.update({
      where: { id: existingProduct.id },
      data: updateData,
    });

    if (data.images) {
      const productName = data.nameEs || existingProduct.nameEs;
      const imagesWithUrl = data.images
        .filter(img => img.url !== undefined && img.url !== '')
        .map(img => ({ url: img.url, isMain: img.isMain ?? false }));
      await handleImagesUpdate(tx, existingProduct.id, existingProduct.slug, imagesWithUrl, productName);
    }

    return tx.product.findUnique({
      where: { id: updated.id },
      include: { images: true, category: true },
    });
  });
}

// Parse and validate body
export function parseProductBody(body: unknown): { data?: UpdateProductData; error?: string } {
  const result = updateProductSchema.safeParse(body);
  if (!result.success) {
    return { error: result.error.errors[0]?.message || 'Error de validación' };
  }
  return { data: result.data };
}
