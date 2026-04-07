export const dynamic = 'force-dynamic';

/**
 * API Route para FAQs (Preguntas Frecuentes)
 * GET /api/faqs - Listado de preguntas frecuentes agrupadas por categoría
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';

// GET /api/faqs - Listar FAQs agrupadas por categoría
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  // Parámetros de filtrado
  const category = searchParams.get('category');
  const isActive = searchParams.get('isActive') !== 'false'; // Por defecto true

  // Construir where clause
  const where: { isActive: boolean; category?: string } = {
    isActive,
  };

  if (category) {
    where.category = category;
  }

  // Buscar FAQs
  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { displayOrder: 'asc' },
    ],
  });

  // Agrupar por categoría (ya en español desde la BD)
  const groupedByCategory = faqs.reduce((acc, faq) => {
    const cat = faq.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push({
      id: faq.id,
      pregunta: faq.question,
      respuesta: faq.answer,
      orden: faq.displayOrder,
    });
    return acc;
  }, {} as Record<string, Array<{ id: string; pregunta: string; respuesta: string; orden: number }>>);

  // Convertir a array de categorías con FAQs
  const categorias = Object.entries(groupedByCategory).map(([nombre, faqsList]) => ({
    nombre,
    faqs: faqsList.sort((a, b) => a.orden - b.orden),
  }));

  return NextResponse.json({
    success: true,
    categorias,
    total: faqs.length,
  });
});
