/**
 * API de Producto Individual Admin
 * Obtener, actualizar y eliminar un producto específico
 *
 * Requiere: Rol ADMIN
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

// Schema de validación para actualización
const updateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  previousPrice: z.number().optional(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(1).optional(),
  categoryId: z.string().uuid(),
  material: z.nativeEnum(Material),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),
  depthCm: z.number().optional(),
  weight: z.number().optional(),
  printTime: z.number().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string(),
      isMain: z.boolean().default(false),
    })
  ).optional(),
});

// Helper para verificar autenticación admin
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

// GET - Obtener producto por slug
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

    // Transformar a español
    const productoTransformado = {
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

    return NextResponse.json({ success: true, producto: productoTransformado });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto
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

    // Verificar que el producto existe
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

    // Generar nuevo slug si cambió el nombre
    const newSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Transacción para actualizar producto y manejar imágenes
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Actualizar producto
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

      // Manejar imágenes si se proporcionan
      if (data.images && data.images.length > 0) {
        // Eliminar imágenes existentes
        await tx.productImage.deleteMany({
          where: { productId: product.id },
        });

        // Crear nuevas imágenes
        for (let i = 0; i < data.images.length; i++) {
          const img = data.images[i];
          await tx.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              filename: img.url.split('/').pop() || 'image.jpg',
              isMain: img.isMain,
              displayOrder: i,
              altText: data.name,
            },
          });
        }
      }

      // Retornar producto con imágenes actualizadas
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

    // Transformar respuesta a español
    const productoTransformado = {
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
      producto: productoTransformado,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando producto:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
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

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Producto not found') },
        { status: 404 }
      );
    }

    // Eliminar producto (las imágenes se eliminan en cascada por la relación)
    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({
      success: true,
      message: translateErrorMessage('Producto eliminado'),
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}
