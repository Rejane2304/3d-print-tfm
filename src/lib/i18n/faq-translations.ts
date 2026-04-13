/**
 * FAQ Translations
 * Traducciones completas para todas las FAQs del sistema
 * Inglés (CSV/BD) → Español (UI)
 */

export const faqTranslations: Record<string, { question: string; answer: string }> = {
  // FAQ-0001 - Materials
  'FAQ-0001': {
    question: '¿Qué materiales utilizáis para las impresiones 3D?',
    answer:
      'Utilizamos principalmente PLA (plástico biodegradable a base de plantas) y PETG (más resistente y térmicamente estable). Ambos son seguros y respetuosos con el medio ambiente.',
  },

  // FAQ-0002 - Shipping
  'FAQ-0002': {
    question: '¿Cuánto tarda el envío?',
    answer:
      'El envío estándar tarda de 3 a 5 días laborables. El envío express se entrega en 1-2 días laborables. Los pedidos superiores a 50€ califican para envío gratuito.',
  },

  // FAQ-0003 - Returns
  'FAQ-0003': {
    question: '¿Puedo devolver o cambiar un producto?',
    answer:
      '¡Sí! Tienes 14 días desde la entrega para devolver cualquier producto en su estado original. Contáctanos en info@3dprint.com para iniciar una devolución.',
  },

  // FAQ-0004 - Orders
  'FAQ-0004': {
    question: '¿Aceptáis pedidos personalizados?',
    answer:
      'Actualmente solo ofrecemos productos de nuestro catálogo fijo. Los pedidos personalizados pueden estar disponibles en el futuro.',
  },

  // FAQ-0005 - Care
  'FAQ-0005': {
    question: '¿Cómo debo cuidar mis artículos impresos en 3D?',
    answer:
      'Mantén alejados de la luz solar directa y fuentes de calor (especialmente artículos de PLA). Limpia con un paño húmedo. Evita sumergir en agua.',
  },

  // FAQ-0006 - Payments
  'FAQ-0006': {
    question: '¿Qué métodos de pago aceptáis?',
    answer:
      'Aceptamos tarjetas de crédito/débito (Visa, Mastercard) y PayPal. Todos los pagos se procesan de forma segura a través de Stripe.',
  },

  // FAQ-0007 - Safety
  'FAQ-0007': {
    question: '¿Son seguros vuestros productos para niños?',
    answer:
      'La mayoría de nuestros productos son adecuados para niños mayores de 3 años. Consulta las descripciones individuales de productos para recomendaciones específicas de edad.',
  },

  // FAQ-0008 - Shipping
  'FAQ-0008': {
    question: '¿Hacéis envíos internacionales?',
    answer: 'Actualmente solo enviamos dentro de España. El envío internacional estará disponible próximamente.',
  },
};

// Traducciones de categorías de FAQ
export const faqCategoryTranslations: Record<string, string> = {
  Materials: 'Materiales',
  Shipping: 'Envío',
  Returns: 'Devoluciones',
  Orders: 'Pedidos',
  Care: 'Cuidado',
  Payments: 'Pagos',
  Safety: 'Seguridad',
  General: 'General',
};

// Helper functions
export function translateFAQQuestion(id: string): string {
  return faqTranslations[id]?.question || '';
}

export function translateFAQAnswer(id: string): string {
  return faqTranslations[id]?.answer || '';
}

export function translateFAQCategory(category: string): string {
  return faqCategoryTranslations[category] || category;
}
