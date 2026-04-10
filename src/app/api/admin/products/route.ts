/**
 * API de Productos Admin
 * CRUD de productos para administradores
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";
import { Material } from "@prisma/client";
import {
  translateProductName,
  translateProductDescription,
  translateProductShortDescription,
  translateCategoryName,
  translateErrorMessage,
} from "@/lib/i18n";

// Schema de validación para imágenes
const imageSchema = z.object({
  url: z
    .string()
    .min(1, "La URL de la imagen es obligatoria")
    .refine(
      (url) => {
        // Permitir URLs blob: temporales (para preview) o URLs con extensión válida
        if (url.startsWith("blob:") || url.startsWith("data:")) {
          return true;
        }
        const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        const lowercaseUrl = url.toLowerCase();
        return validExtensions.some((ext) => lowercaseUrl.endsWith(ext));
      },
      {
        message:
          "La URL debe terminar en .jpg, .jpeg, .png, .webp o .gif o ser una URL temporal válida",
      },
    ),
  isMain: z.boolean().default(false),
});

// Schema de validación
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  previousPrice: z.number().optional().nullable(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid(),
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
    .min(1, "Debe agregar al menos una imagen")
    .refine((images) => images.some((img) => img.isMain), {
      message: "Debe marcar al menos una imagen como principal",
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
      return NextResponse.json(
        { success: false, error: translateErrorMessage("No autenticado") },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: translateErrorMessage("No autorizado") },
        { status: 401 },
      );
    }

    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { displayOrder: "asc" },
        },
        category: true,
      },
      // No ordering in DB - will sort after translation
    });

    // Translate products to Spanish for admin panel
    // Admin should see data in Spanish following project UI standard
    const productosTraducidos = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      nombre: translateProductName(product.slug),
      descripcion: translateProductDescription(product.slug),
      descripcionCorta: translateProductShortDescription(product.slug),
      precio: Number(product.price),
      precioAnterior: product.previousPrice
        ? Number(product.previousPrice)
        : null,
      stock: product.stock,
      categoria: product.category
        ? translateCategoryName(product.category.slug)
        : "Sin categoría",
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
    productosTraducidos.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );

    return NextResponse.json({ success: true, productos: productosTraducidos });
  } catch (error) {
    console.error("Error listando productos:", error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage("Internal error") },
      { status: 500 },
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
        { success: false, error: translateErrorMessage("No autenticado") },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: translateErrorMessage("No autorizado") },
        { status: 401 },
      );
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    // Generar slug
    // Normalize accented characters first, then convert to lowercase and replace special chars
    const slug = data.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Crear producto e imágenes en una transacción
    const product = await prisma.$transaction(async (tx) => {
      // Crear el producto - usar spread para construir el objeto dinámicamente
      const newProduct = await tx.product.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description,
          shortDescription: data.shortDescription,
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
            filename: img.url.split("/").pop() || "image.jpg",
            isMain: img.isMain ?? i === 0, // Primera imagen como principal por defecto
            displayOrder: i,
            altText: data.name,
          },
        });
      }

      // Retornar el producto con imágenes
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: { images: true },
      });
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error creando producto:", error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage("Internal error") },
      { status: 500 },
    );
  }
}
