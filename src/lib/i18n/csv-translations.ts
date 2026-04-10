/**
 * CSV Data Translations
 * Traducciones para todos los archivos CSV de datos
 * Inglés (CSV) → Español (UI)
 */

// ============================================================================
// PRODUCT TRANSLATIONS (from products.csv)
// ============================================================================

export const productTranslations: Record<
  string,
  {
    name: string;
    description: string;
    shortDescription: string;
  }
> = {
  "PROD-0001": {
    name: "Jarrón Decorativo Floral",
    description:
      "Jarrón con diseño floral para decoración del hogar. Perfecto para flores artificiales o como pieza decorativa independiente.",
    shortDescription: "Elegante jarrón floral para decoración del hogar",
  },
  "PROD-0002": {
    name: "Organizador de Escritorio Hexagonal",
    description:
      "Organizador hexagonal modular para suministros de oficina y hogar. Cada módulo se puede combinar para crear configuraciones personalizadas.",
    shortDescription: "Organizador modular de 3 piezas para escritorio",
  },
  "PROD-0003": {
    name: "Macetero Geométrico Minimalista",
    description:
      "Macetero de diseño geométrico para plantas pequeñas. Cuenta con agujero de drenaje y estética angular moderna. Ideal para suculentas y cactus.",
    shortDescription: "Macetero geométrico moderno con drenaje",
  },
  "PROD-0004": {
    name: "Soporte Ajustable para Teléfono",
    description:
      "Soporte para teléfono inteligente con ángulo ajustable. Compatible con teléfonos de hasta 7 pulgadas. Incluye ranura para gestión de cables.",
    shortDescription: "Soporte universal ajustable para teléfono",
  },
  "PROD-0005": {
    name: "Figura Articulada de Dinosaurio Rex",
    description:
      "Figura de dinosaurio articulada para colección. 15 articulaciones móviles para poses realistas. Impreso en una pieza sin necesidad de ensamblaje.",
    shortDescription: "T-Rex articulado con 15 puntos de movimiento",
  },
  "PROD-0006": {
    name: "Miniatura de Casa",
    description:
      "Casa miniatura detallada para decoración. Estilo victoriano con techo extraíble. Perfecta para dioramas o estantes de exhibición.",
    shortDescription: "Casa miniatura victoriana con techo extraíble",
  },
  "PROD-0007": {
    name: "Porta Lápices/Pinceles Dragón",
    description:
      "Soporte con forma de dragón estilizado para lápices o pinceles. Presenta escamas texturizadas y alas detalladas. Ajusta lápices y pinceles estándar.",
    shortDescription: "Organizador de escritorio en forma de dragón",
  },
  "PROD-0008": {
    name: "Auto Clásico Articulado",
    description:
      "Auto clásico articulado con ruedas móviles. Diseño vintage de los años 50 con puertas que se abren. Interior detallado y efectos cromados.",
    shortDescription: "Auto vintage con piezas móviles",
  },
  "PROD-0009": {
    name: "Lámpara Luna 3D",
    description:
      "Lámpara LED nocturna con forma realista de luna. Incluye base recargable USB con atenuador táctil. Textura superficial lunar realista.",
    shortDescription: "Lámpara luna LED con atenuador táctil",
  },
  "PROD-0010": {
    name: "Caja Secreta Medieval",
    description:
      "Caja secreta con diseño de castillo medieval. Compartimento oculto con mecanismo de puzzle. Ideal para guardar pequeños objetos de valor o como regalo.",
    shortDescription: "Caja puzzle con compartimento oculto",
  },
};

// ============================================================================
// REVIEW TRANSLATIONS (from reviews.csv)
// ============================================================================

export const reviewTranslations: Record<
  string,
  { title: string; comment: string }
> = {
  "REV-0001": {
    title: "Perfecto para mi escritorio",
    comment:
      "Exactamente lo que necesitaba para organizar mis bolígrafos y suministros. ¡Gran calidad!",
  },
  "REV-0002": {
    title: "Buena calidad",
    comment: "Bonito organizador pero desearía que viniera en más colores.",
  },
  "REV-0003": {
    title: "El mejor soporte para teléfono",
    comment: "Súper resistente y el ángulo es perfecto para videollamadas.",
  },
  "REV-0004": {
    title: "Gran relación calidad-precio",
    comment: "Calidad asombrosa para el precio. ¡Muy recomendado!",
  },
  "REV-0005": {
    title: "¡A mi hijo le encanta!",
    comment:
      "Las articulaciones están muy bien hechas. Regalo perfecto para fans de dinosaurios.",
  },
  "REV-0006": {
    title: "Coleccionable genial",
    comment:
      "Muy detallado y divertido de posar. Faltan algunos detalles menores pero en general excelente.",
  },
  "REV-0007": {
    title: "Artesanía impresionante",
    comment:
      "Las ruedas realmente giran y las puertas se abren. ¡Atención al detalle asombrosa!",
  },
  "REV-0008": {
    title: "Calidad de coleccionista",
    comment:
      "Mejor de lo esperado. Definitivamente compraré más de esta tienda.",
  },
  "REV-0009": {
    title: "Lámpara hermosa",
    comment: "Crea una atmósfera tan acogedora en mi dormitorio. ¡Me encanta!",
  },
  "REV-0010": {
    title: "Regalo increíble",
    comment:
      "Compré esto como regalo y quedaron encantados. La textura lunar es increíble.",
  },
  "REV-0011": {
    title: "Genial pero frágil",
    comment: "Producto hermoso pero manejar con cuidado durante el envío.",
  },
  "REV-0012": {
    title: "Bonito jarrón",
    comment: "Diseño bonito pero más pequeño de lo esperaba.",
  },
  "REV-0013": {
    title: "Perfecto para suculentas",
    comment: "Se ve genial en mi alféizar con un pequeño cactus.",
  },
  "REV-0014": {
    title: "Detalle increíble",
    comment:
      "El nivel de detalle en esta miniatura es impresionante. Vale cada euro.",
  },
  "REV-0015": {
    title: "Caja puzzle divertida",
    comment:
      "Me tomó 10 minutos descubrir cómo abrirla. ¡Gran pieza de conversación!",
  },
};

// ============================================================================
// SITE CONFIG TRANSLATIONS (from site_config.csv)
// ============================================================================

export const siteConfigTranslations: Record<string, { value: string }> = {
  siteName: { value: "3D Print TFM" },
  siteDescription: { value: "Impresión 3D de calidad para tu hogar y oficina" },
  contactEmail: { value: "soporte@3dprint.com" },
  contactPhone: { value: "+34 900 123 456" },
  address: { value: "Calle Ejemplo 123, Madrid, España" },
  shippingInfo: { value: "Envío gratuito en pedidos superiores a 50€" },
  returnPolicy: { value: "14 días de devolución garantizada" },
};

// ============================================================================
// ALERT TRANSLATIONS (from alerts.csv)
// ============================================================================

export const alertTranslations: Record<
  string,
  { title: string; message: string }
> = {
  "ALRT-0001": {
    title: "Stock bajo",
    message: "Lámpara Lunar 3D tiene stock bajo (2 unidades restantes)",
  },
  "ALRT-0002": {
    title: "Stock bajo",
    message:
      "Figura Articulada de Dinosaurio Rex tiene stock bajo (4 unidades restantes)",
  },
  "ALRT-0003": {
    title: "Pedido retrasado",
    message: "El pedido P-2024-000015 lleva más de 48 horas sin confirmarse",
  },
  "ALRT-0004": {
    title: "Pago fallido",
    message: "El pago del pedido P-2024-000018 ha fallado 3 veces",
  },
  "ALRT-0005": {
    title: "Sin stock",
    message: "Soporte Ajustable para Teléfono está agotado",
  },
};

// ============================================================================
// SHIPPING CONFIG TRANSLATIONS (from shipping_config.csv)
// ============================================================================

export const shippingConfigTranslations: Record<
  string,
  { name: string; description: string }
> = {
  "SHIP-0001": {
    name: "Envío Estándar",
    description: "Entrega estándar en 3-5 días hábiles",
  },
  "SHIP-0002": {
    name: "Envío Express",
    description: "Entrega express en 1-2 días hábiles",
  },
  "SHIP-0003": {
    name: "Envío Gratuito",
    description: "Envío gratis para pedidos superiores a 50€",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function translateProductName(ref: string): string {
  return productTranslations[ref]?.name || "";
}

export function translateProductDescription(ref: string): string {
  return productTranslations[ref]?.description || "";
}

export function translateProductShortDescription(ref: string): string {
  return productTranslations[ref]?.shortDescription || "";
}

export function translateReview(
  ref: string,
): { title: string; comment: string } | null {
  return reviewTranslations[ref] || null;
}

export function translateSiteConfig(key: string): string {
  return siteConfigTranslations[key]?.value || "";
}

export function translateAlert(
  ref: string,
): { title: string; message: string } | null {
  return alertTranslations[ref] || null;
}

export function translateShippingConfig(
  ref: string,
): { name: string; description: string } | null {
  return shippingConfigTranslations[ref] || null;
}
