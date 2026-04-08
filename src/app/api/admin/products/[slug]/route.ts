/**
 * Admin Individual Product API
 * Get, update and delete a specific product
 *
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
  translateMaterial,
  translateErrorMessage,
} from '@/lib/i18n';

// Validation schema for update with Spanish error messages
const updateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  shortDescription: z.string().optional(),
  price: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' })
      .min(0.01, 'El precio debe ser mayor que 0')
  ),
  previousPrice: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : Number(val)),
    z.number({ invalid_type_error: 'El precio anterior debe ser un número' })
      .min(0, 'El precio anterior no puede ser negativo')
      .optional()
  ).nullable().default(null),
  stock: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number({ required_error: 'El stock es obligatorio', invalid_type_error: 'El stock debe ser un número' })
      .int('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo')
  ),
  minStock: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? 5 : Number(val)),
    z.number({ invalid_type_error: 'El stock mínimo debe ser un número' })
      .int('El stock mínimo debe ser un número entero')
      .min(1, 'El stock mínimo debe ser al menos 1')
  ).default(5),
  categoryId: z.string().uuid('ID de categoría inválido'),
  material: z.nativeEnum(Material),
  widthCm: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'El ancho debe ser un número' }).optional()
  ).optional(),
  heightCm: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'El alto debe ser un número' }).optional()
  ).optional(),
  depthCm: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'La profundidad debe ser un número' }).optional()
  ).optional(),
  weight: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : Number(val)),
    z.number({ invalid_type_error: 'El peso debe ser un número' }).optional()
  ).nullable().default(null),
  printTime: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : Number(val)),
    z.number({ invalid_type_error: 'El tiempo de impresión debe ser un número' })
      .int('El tiempo debe ser un número entero')
      .optional()
  ).nullable().default(null),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string(),
      isMain: z.boolean().default(false),
    })
  ).optional(),
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

// GET - Get product by slug
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

    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    // Transform to Spanish
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      nombre: translateProductName(product.slug),
      descripcion: translateProductDescription(product.slug),
      descripcionCorta: translateProductShortDescription(product.slug),
      precio: Number(product.price),
      precioAnterior: product.previousPrice ? Number(product.previousPrice) : null,
      stock: product.stock,
      minStock: product.minStock,
      categoriaId: product.categoryId,
      categoria: product.category ? translateCategoryName(product.category.slug) : 'Sin categoría',
      material: translateMaterial(product.material),
      anchoCm: product.widthCm,
      altoCm: product.heightCm,
      profundidadCm: product.depthCm,
      peso: product.weight,
      tiempoImpresion: product.printTime,
      activo: product.isActive,
      destacado: product.isFeatured,
      imagenes: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        esPrincipal: img.isMain,
        orden: img.displayOrder,
      })),
      creadoEn: product.createdAt,
      actualizadoEn: product.updatedAt,
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

    const { slug } = params;

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });

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
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Transaction to update product and handle images
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { slug },
        data: {
          name: data.name,
          description: data.description,
          shortDescription: data.shortDescription,
          price: data.price,
          previousPrice: data.previousPrice,
          stock: data.stock,
          minStock: data.minStock,
          categoryId: data.categoryId,
          material: data.material,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          depthCm: data.depthCm,
          weight: data.weight,
          printTime: data.printTime,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          slug: newSlug,
        },
      });

    // Handle images - always delete and recreate to ensure consistency
    await tx.productImage.deleteMany({
      where: { productId: product.id },
    });

    // Create images from the provided data
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            filename: img.url.split('/').pop() || 'image.jpg',
            isMain: img.isMain ?? (i === 0), // Default to first image as main
            displayOrder: i,
            altText: data.name,
          },
        });
      }
    }

      // Return product with updated images
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          category: true,
        },
      });
    });

    if (!updatedProduct) {
      throw new Error('Error al actualizar producto');
    }

    // Transform response to Spanish
    const transformedProduct = {
      id: updatedProduct.id,
      slug: updatedProduct.slug,
      nombre: translateProductName(updatedProduct.slug),
      descripcion: translateProductDescription(updatedProduct.slug),
      descripcionCorta: translateProductShortDescription(updatedProduct.slug),
      precio: Number(updatedProduct.price),
      precioAnterior: updatedProduct.previousPrice
        ? Number(updatedProduct.previousPrice)
        : null,
      stock: updatedProduct.stock,
      minStock: updatedProduct.minStock,
      categoriaId: updatedProduct.categoryId,
      categoria: updatedProduct.category
        ? translateCategoryName(updatedProduct.category.slug)
        : 'Sin categoría',
      material: translateMaterial(updatedProduct.material),
      anchoCm: updatedProduct.widthCm,
      altoCm: updatedProduct.heightCm,
      profundidadCm: updatedProduct.depthCm,
      peso: updatedProduct.weight,
      tiempoImpresion: updatedProduct.printTime,
      activo: updatedProduct.isActive,
      destacado: updatedProduct.isFeatured,
      imagenes: updatedProduct.images.map((img) => ({
        id: img.id,
        url: img.url,
        esPrincipal: img.isMain,
        orden: img.displayOrder,
      })),
      creadoEn: updatedProduct.createdAt,
      actualizadoEn: updatedProduct.updatedAt,
    };

    return NextResponse.json({
      success: true,
      producto: transformedProduct,
    });
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

    const { slug } = params;

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    // Delete product (images are deleted in cascade by the relationship)
    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({
      success: true,
      message: translateErrorMessage('Producto eliminado'),
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}
