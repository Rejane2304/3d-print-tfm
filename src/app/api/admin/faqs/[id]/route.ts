/**
 * API de FAQ Individual Admin
 * CRUD de una FAQ específica
 *
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";
import {
  faqTranslations,
  faqCategoryTranslations,
} from "@/lib/i18n/faq-translations";

// Mapeo de categorías en inglés → español
const categoryTranslations: Record<string, string> = {
  Materials: "Materiales",
  Shipping: "Envío",
  Returns: "Devoluciones",
  Orders: "Pedidos",
  Care: "Cuidado",
  Payments: "Pagos",
  Safety: "Seguridad",
};

// Schema de validación
const faqUpdateSchema = z.object({
  question: z
    .string()
    .min(1, "La pregunta es obligatoria")
    .max(500, "Máximo 500 caracteres")
    .optional(),
  answer: z
    .string()
    .min(1, "La respuesta es obligatoria")
    .max(5000, "Máximo 5000 caracteres")
    .optional(),
  category: z
    .string()
    .min(1, "La categoría es obligatoria")
    .max(100, "Máximo 100 caracteres")
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET - Obtener FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json(
        { success: false, error: "FAQ no encontrada" },
        { status: 404 },
      );
    }

    // Formatear para el panel admin (traducir inglés → español)
    const ref = faq.id.slice(0, 8).toUpperCase();

    // Buscar traducción en el diccionario
    const translation = faqTranslations[faq.id];

    const faqFormateada = {
      id: faq.id,
      _ref: ref,
      pregunta: translation?.question || faq.question,
      respuesta: translation?.answer || faq.answer,
      categoria:
        faqCategoryTranslations[faq.category] ||
        categoryTranslations[faq.category] ||
        faq.category,
      ordenVisualizacion: faq.displayOrder,
      activo: faq.isActive,
      creadoEn: faq.createdAt,
      actualizadoEn: faq.updatedAt,
    };

    return NextResponse.json({ success: true, faq: faqFormateada });
  } catch (error) {
    console.error("Error obteniendo FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

// PATCH - Actualizar FAQ
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    // Verificar que la FAQ existe
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "FAQ no encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = faqUpdateSchema.parse(body);

    // Actualizar FAQ
    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(data.question && { question: data.question }),
        ...(data.answer && { answer: data.answer }),
        ...(data.category && { category: data.category }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error actualizando FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    // Verificar que la FAQ existe
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "FAQ no encontrada" },
        { status: 404 },
      );
    }

    // Eliminar FAQ
    await prisma.fAQ.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "FAQ eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
