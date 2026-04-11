/**
 * API de FAQs Admin
 * CRUD de FAQs para administradores
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
const faqSchema = z.object({
  question: z
    .string()
    .min(1, "La pregunta es obligatoria")
    .max(500, "Máximo 500 caracteres"),
  answer: z
    .string()
    .min(1, "La respuesta es obligatoria")
    .max(5000, "Máximo 5000 caracteres"),
  category: z
    .string()
    .min(1, "La categoría es obligatoria")
    .max(100, "Máximo 100 caracteres"),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET - Listar FAQs
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

    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });

    // Formatear para el panel admin (traducir inglés → español)
    const faqsFormateadas = faqs.map((faq) => {
      const ref = faq.id.slice(0, 8).toUpperCase();

      // Buscar traducción en el diccionario
      const translation = faqTranslations[faq.id];

      return {
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
    });

    return NextResponse.json({ success: true, faqs: faqsFormateadas });
  } catch (error) {
    console.error("Error listando FAQs:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

// POST - Crear FAQ
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

    const body = await req.json();
    const data = faqSchema.parse(body);

    // Crear FAQ
    const faq = await prisma.fAQ.create({
      data: {
        id: crypto.randomUUID(),
        question: data.question,
        answer: data.answer,
        category: data.category,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error creando FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
