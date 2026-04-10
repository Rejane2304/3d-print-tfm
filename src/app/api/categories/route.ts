/**
 * API Route - Categories
 * GET /api/categories
 * Returns all active categories for dropdowns
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { translateCategoryName } from "@/lib/i18n";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    // Translate to Spanish
    const categoriesTranslated = categories.map((cat) => ({
      id: cat.id,
      nombre: translateCategoryName(cat.slug),
      slug: cat.slug,
      descripcion: cat.description,
    }));

    return NextResponse.json({
      success: true,
      categories: categoriesTranslated,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar categorías" },
      { status: 500 },
    );
  }
}
