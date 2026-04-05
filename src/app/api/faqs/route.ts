/**
 * API Route para FAQs (Preguntas Frecuentes)
 * GET /api/faqs - Listado de preguntas frecuentes en español
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { translateFAQ } from '@/lib/i18n';

// GET /api/faqs - Listar FAQs
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
    orderBy: {
      displayOrder: 'asc',
    },
  });

  // Traducir campos a español
  const translatedFAQs = faqs.map((faq) => ({
    ...faq,
    question: translateFAQ(faq.id, 'question') || faq.question,
    answer: translateFAQ(faq.id, 'answer') || faq.answer,
    category: translateFAQ(faq.id, 'category') || faq.category,
  }));

  return NextResponse.json({
    success: true,
    data: translatedFAQs,
    count: translatedFAQs.length,
  });
});
