/**
 * API de Productos Admin
 * CRUD de productos para administradores
 *
 * Requiere: Rol ADMIN
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

// Schema de validación para imágenes
const imageSchema = z.object({
  url: z
    .string()
    .min(1, 'La URL de la imagen es obligatoria')
    .refine(
      url => {
        // Permitir URLs blob: temporales (para preview) o URLs con extensión válida
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          return true;
        }
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const lowercaseUrl = url.toLowerCase();
        return validExtensions.some(ext => lowercaseUrl.endsWith(ext));
      },
      {
        message: 'La URL debe terminar en .jpg, .jpeg, .png, .webp o .gif o ser una URL temporal válida',
      },
    ),
  isMain: z.boolean().default(false),
});

// Schema de validación para producto bilingüe
const productSchema = z.object({
  // Bilingual fields - required
  nameEs: z.string().min(2, 'El nombre en español debe tener al menos 2 caracteres'),
  nameEn: z.string().min(2, 'El nombre en inglés debe tener al menos 2 caracteres'),
  descriptionEs: z.string().min(10, 'La descripción en español debe tener al menos 10 caracteres'),
  descriptionEn: z.string().min(10, 'La descripción en inglés debe tener al menos 10 caracteres'),
  // Bilingual fields - optional
  shortDescEs: z.string().max(255, 'La descripción corta no puede exceder 255 caracteres').optional(),
  shortDescEn: z.string().max(255, 'La descripción corta no puede exceder 255 caracteres').optional(),
  metaTitleEs: z.string().max(200, 'El meta título no puede exceder 200 caracteres').optional(),
  metaTitleEn: z.string().max(200, 'El meta título no puede exceder 200 caracteres').optional(),
  metaDescEs: z.string().max(300, 'La meta descripción no puede exceder 300 caracteres').optional(),
  metaDescEn: z.string().max(300, 'La meta descripción no puede exceder 300 caracteres').optional(),
  // Other fields
  price: z.number().positive('El precio debe ser mayor a 0'),
  previousPrice: z.number().optional().nullable(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  categoryId: z.string().uuid('ID de categoría inválido'),
  material: z.nativeEnum(Material),
  widthCm: z.number().optional().nullable(),
  heightCm: z.number().optional().nullable(),
  depthCm: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  printTime: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z
    .array(imageSchema)
    .min(1, 'Debe agregar al menos una imagen')
    .refine(images => images.some(img => img.isMain), {
      message: 'Debe marcar al menos una imagen como principal',
    }),
});

// GET - Listar productos
export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
      },
      // No ordering in DB - will sort after translation
    });

    // Translate products to Spanish for admin panel
    // Admin should see data in Spanish following project UI standard
    const productosTraducidos = products.map(product => ({
      id: product.id,
      slug: product.slug,
      nombre: translateProductName(product.slug),
      descripcion: translateProductDescription(product.slug),
      descripcionCorta: translateProductShortDescription(product.slug),
      precio: Number(product.price),
      precioAnterior: product.previousPrice ? Number(product.previousPrice) : null,
      stock: product.stock,
      categoria: product.category ? translateCategoryName(product.category.slug) : 'Sin categoría',
      material: product.material,
      anchoCm: product.widthCm,
      altoCm: product.heightCm,
      profundidadCm: product.depthCm,
      peso: product.weight,
      tiempoImpresion: product.printTime,
      activo: product.isActive,
      destacado: product.isFeatured,
      imagenes: product.images,
      creadoEn: product.createdAt,
      actualizadoEn: product.updatedAt,
    }));

    // Sort by translated Spanish name alphabetically
    productosTraducidos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    return NextResponse.json({ success: true, productos: productosTraducidos });
  } catch (error) {
    console.error('Error listando productos:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}

// POST - Crear producto
export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autenticado') }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: translateErrorMessage('No autorizado') }, { status: 401 });
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    // Generar slug basado en el nombre en español
    // Normalize accented characters first, then convert to lowercase and replace special chars
    const slug = data.nameEs
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');

    // Crear producto e imágenes en una transacción
    const product = await prisma.$transaction(async tx => {
      // Crear el producto con campos bilingües
      const newProduct = await tx.product.create({
        data: {
          id: crypto.randomUUID(),
          // Bilingual fields
          nameEs: data.nameEs,
          nameEn: data.nameEn,
          descriptionEs: data.descriptionEs,
          descriptionEn: data.descriptionEn,
          shortDescEs: data.shortDescEs,
          shortDescEn: data.shortDescEn,
          metaTitleEs: data.metaTitleEs,
          metaTitleEn: data.metaTitleEn,
          metaDescEs: data.metaDescEs,
          metaDescEn: data.metaDescEn,
          // Legacy fields (usar español por defecto)
          name: data.nameEs,
          description: data.descriptionEs,
          shortDescription: data.shortDescEs,
          metaTitle: data.metaTitleEs,
          metaDescription: data.metaDescEs,
          // Other fields
          price: data.price,
          previousPrice: data.previousPrice ?? undefined,
          stock: data.stock,
          category: { connect: { id: data.categoryId } },
          material: data.material,
          widthCm: data.widthCm ?? undefined,
          heightCm: data.heightCm ?? undefined,
          depthCm: data.depthCm ?? undefined,
          weight: data.weight ?? undefined,
          printTime: data.printTime ?? undefined,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          slug,
          updatedAt: new Date(),
        },
      });

      // Crear las imágenes del producto
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await tx.productImage.create({
          data: {
            id: crypto.randomUUID(),
            product: { connect: { id: newProduct.id } },
            url: img.url,
            filename: img.url.split('/').pop() || 'image.jpg',
            isMain: img.isMain ?? i === 0, // Primera imagen como principal por defecto
            displayOrder: i,
            altText: data.nameEs,
          },
        });
      }

      // Retornar el producto con imágenes
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: { images: true },
      });
    });

    // Return product with Spanish fields for the UI
    if (!product) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Error creating product') },
        { status: 500 },
      );
    }

    const responseProduct = {
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
      images: product.images,
      categoryId: product.categoryId,
    };

    return NextResponse.json({ success: true, product: responseProduct }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creando producto:', error);
    return NextResponse.json({ success: false, error: translateErrorMessage('Internal error') }, { status: 500 });
  }
}
