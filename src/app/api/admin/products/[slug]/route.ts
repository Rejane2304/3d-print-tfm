/**
 * Admin Product Detail API
 * GET, PUT, DELETE /api/admin/products/[identifier]
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { translateCategoryName, translateErrorMessage } from '@/lib/i18n';
import { rmdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  verifyAdminAuth,
  findProduct,
  parseProductBody,
  updateProductTransaction,
  transformProductForPutResponse,
  type UpdateProductData,
  type MaterialType,
} from './processor';

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
  material: MaterialType;
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
    nombre: product.nameEs,
    descripcion: product.descriptionEs,
    descripcionCorta: product.shortDescEs,
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

// Delete product directory
async function deleteProductDirectory(productSlug: string): Promise<void> {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'images', 'products', productSlug);
    if (existsSync(dirPath)) {
      await rmdir(dirPath, { recursive: true });
    }
  } catch {
    // Directory doesn't exist or error deleting
  }
}

// GET handler
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = await params;
    const product = await findProduct(identifier);

    if (!product) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    return NextResponse.json({ success: true, producto: transformProductForResponse(product) });
  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// PUT handler - Ultra simple (≤15 líneas)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await verifyAdminAuth();
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const { slug: identifier } = await params;
  const existingProduct = await findProduct(identifier);
  if (!existingProduct)
    return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });

  const body = await req.json();
  const { data, error } = parseProductBody(body);
  if (error) return NextResponse.json({ success: false, error }, { status: 400 });

  const updated = await updateProductTransaction(existingProduct, data as UpdateProductData);
  const responseProduct = updated
    ? transformProductForPutResponse(updated as Parameters<typeof transformProductForPutResponse>[0])
    : null;

  return NextResponse.json({ success: true, product: responseProduct });
}

// DELETE handler
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug: identifier } = await params;
    const existingProduct = await findProduct(identifier);

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: translateErrorMessage('Producto not found') }, { status: 404 });
    }

    await deleteProductDirectory(existingProduct.slug);
    await prisma.product.delete({ where: { id: existingProduct.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
