export const dynamic = 'force-dynamic';

/**
 * API Route para FAQs (Preguntas Frecuentes)
 * GET /api/faqs - Listado de preguntas frecuentes agrupadas por categoría
 * Traduce inglés → español antes de enviar al frontend
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { translateFAQ, faqTranslations } from '@/lib/i18n';

// Mapeo de categorías en inglés → español
const categoryTranslations: Record<string, string> = {
  'Materials': 'Materiales',
  'Shipping': 'Envío',
  'Returns': 'Devoluciones',
  'Orders': 'Pedidos',
  'Care': 'Cuidado',
  'Payments': 'Pagos',
  'Safety': 'Seguridad',
};

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

  // Agrupar por categoría con traducción al español
  const groupedByCategory = faqs.reduce((acc, faq) => {
    // Extraer el ref de la FAQ (FAQ-0001, FAQ-0002, etc.)
    const ref = faq.id.slice(0, 8).toUpperCase();
    
    // Traducir usando el módulo i18n
    const preguntaTraducida = translateFAQ(ref, 'question') || faq.question;
    const respuestaTraducida = translateFAQ(ref, 'answer') || faq.answer;
    const categoriaTraducida = translateFAQ(ref, 'category') || categoryTranslations[faq.category] || faq.category;
    
    if (!acc[categoriaTraducida]) {
      acc[categoriaTraducida] = [];
    }
    
    acc[categoriaTraducida].push({
      id: faq.id,
      pregunta: preguntaTraducida,
      respuesta: respuestaTraducida,
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
