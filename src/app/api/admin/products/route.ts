/**
 * API de Productos Admin
 * CRUD de productos para administradores
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
} from '@/lib/i18n';

// Schema de validación
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  previousPrice: z.number().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid(),
  material: z.nativeEnum(Material),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),
  depthCm: z.number().optional(),
  weight: z.number().optional(),
  printTime: z.number().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Translate products to Spanish for admin panel
    const productosTraducidos = products.map((product) => ({
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

    return NextResponse.json({ success: true, productos: productosTraducidos });
  } catch (error) {
    console.error('Error listando productos:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    // Generar slug
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Crear producto
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        previousPrice: data.previousPrice,
        stock: data.stock,
        categoryId: data.categoryId,
        material: data.material,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        depthCm: data.depthCm,
        weight: data.weight,
        printTime: data.printTime,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        slug,
      },
    });

    return NextResponse.json(
      { success: true, product },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
