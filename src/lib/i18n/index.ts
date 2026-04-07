/**
 * Backend Translation Module
 * 100% backend translation before sending to frontend
 * 
 * Architecture:
 * - DB: English (PENDING, COMPLETED, etc.)
 * - Code: English (getOrders, createUser, etc.)
 * - API Routes: Transform English → Spanish
 * - Frontend: Receives Spanish directly
 * - UI: 100% Spanish
 */

// ============================================================================
// ENUM TRANSLATIONS - Statuses, methods, types
// ============================================================================

type TranslationMap = Record<string, string>;

export const enumTranslations = {
  // Order statuses
  orderStatus: {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'En preparación',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  } as TranslationMap,

  // Payment statuses
  paymentStatus: {
    PENDING: 'Pendiente',
    PROCESSING: 'Procesando',
    COMPLETED: 'Completado',
    FAILED: 'Fallido',
    REFUNDED: 'Reembolsado',
    PARTIAL: 'Parcial',
  } as TranslationMap,

  // Payment methods
  paymentMethod: {
    CARD: 'Tarjeta',
    PAYPAL: 'PayPal',
    BIZUM: 'Bizum',
    TRANSFER: 'Transferencia',
  } as TranslationMap,

  // Alert types
  alertType: {
    LOW_STOCK: 'Stock bajo',
    OUT_OF_STOCK: 'Sin stock',
    ORDER_DELAYED: 'Pedido retrasado',
    PAYMENT_FAILED: 'Pago fallido',
    SYSTEM_ERROR: 'Error del sistema',
  } as TranslationMap,

  // Alert severity
  alertSeverity: {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  } as TranslationMap,

  // Alert status
  alertStatus: {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    RESOLVED: 'Resuelto',
    IGNORED: 'Ignorado',
  } as TranslationMap,

  // Movement types
  movementType: {
    IN: 'Entrada',
    OUT: 'Salida',
    ADJUSTMENT: 'Ajuste',
    CANCELLATION: 'Cancelación',
    RETURN: 'Devolución',
  } as TranslationMap,

  // Coupon types
  couponType: {
    PERCENTAGE: 'Porcentaje',
    FIXED: 'Fijo',
    FREE_SHIPPING: 'Envío gratis',
  } as TranslationMap,

  // Materials
  material: {
    PLA: 'PLA',
    PETG: 'PETG',
  } as TranslationMap,
};

// ============================================================================
// ADDRESS NAME TRANSLATIONS
// ============================================================================

export const addressNameTranslations: TranslationMap = {
  home: 'Casa',
  house: 'Casa',
  work: 'Trabajo',
  office: 'Oficina',
  apartment: 'Apartamento',
  flat: 'Piso',
  parents: 'Casa de padres',
  family: 'Casa familiar',
};

// ============================================================================
// ERROR MESSAGE TRANSLATIONS
// ============================================================================

export const errorMessages: TranslationMap = {
  // Auth errors
  'Invalid email or password': 'Email o contraseña incorrectos',
  'Session expired, please log in again': 'Sesión expirada, por favor inicia sesión de nuevo',
  'You do not have permission to perform this action': 'No tienes permiso para realizar esta acción',
  'No autenticado': 'No autenticado',
  'No autorizado': 'No autorizado',
  
  // Validation errors
  'The field ${field} is not valid': 'El campo ${field} no es válido',
  'The field ${field} is required': 'El campo ${field} es obligatorio',
  'El nombre is required': 'El nombre es obligatorio',
  'El destinatario is required': 'El destinatario es obligatorio',
  
  // Database errors
  '${resource} not found': '${resource} no encontrado',
  'Usuario not found': 'Usuario no encontrado',
  'Pedido not found': 'Pedido no encontrado',
  'Producto not found': 'Producto no encontrado',
  'Item not found': 'Artículo no encontrado',
  'Mensaje not found': 'Mensaje no encontrado',
  'Factura not found': 'Factura no encontrado',
  'Already exists a record with that ${field}': 'Ya existe un registro con ese ${field}',
  'Already exists una factura para este pedido': 'Ya existe una factura para este pedido',
  'Invalid reference in ${context}': 'Referencia inválida en ${context}',
  
  // Business errors
  'Insufficient stock for ${product}': 'Stock insuficiente para ${product}',
  'Insufficient stock': 'Stock insuficiente',
  'Insufficient stock para la cantidad total': 'Stock insuficiente para la cantidad total',
  'Cannot ${action} in state ${state}': 'No se puede ${action} en estado ${state}',
  'Payment failed: ${reason}': 'Pago fallido: ${reason}',
  
  // Server errors
  'Internal error of the server': 'Error interno del servidor',
  'Internal error': 'Error interno',
  'Service unavailable, try again later': 'Servicio no disponible, inténtalo más tarde',
  'Webhook processing failed': 'Procesamiento de webhook fallido',
  
  // General
  'Error unknown': 'Error desconocido',
  'Unknown': 'Desconocido',
  'No image': 'Sin imagen',
  'Last units!': '¡Últimas unidades!',
  'Out of stock': 'Agotado',
  'In stock': 'En stock',
  
  // Validation messages
  'Email is required': 'El email es obligatorio',
  'Invalid email format': 'Formato de email inválido',
  'Password is required': 'La contraseña es obligatoria',
  'Password must be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres',
  'Password must contain at least one uppercase, one lowercase and one number': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  'Passwords do not match': 'Las contraseñas no coinciden',
  'Current password is required': 'La contraseña actual es obligatoria',
  'New password must be at least 8 characters': 'La nueva contraseña debe tener al menos 8 caracteres',
  'Name is required': 'El nombre es obligatorio',
  'Name must be at least 3 characters': 'El nombre debe tener al menos 3 caracteres',
  'Name cannot exceed 100 characters': 'El nombre no puede exceder 100 caracteres',
  'Phone must be in Spanish format: +34 600 123 456': 'El teléfono debe estar en formato español: +34 600 123 456',
  'Tax ID must have 8 numbers and one uppercase letter': 'El NIF debe tener 8 números y una letra mayúscula',
  'Fiscal name cannot exceed 200 characters': 'El nombre fiscal no puede exceder 200 caracteres',
  'Address name is required': 'El nombre de la dirección es obligatorio',
  'Recipient name is required': 'El nombre del destinatario es obligatorio',
  'Recipient cannot exceed 100 characters': 'El destinatario no puede exceder 100 caracteres',
  'Address is required': 'La dirección es obligatoria',
  'Address cannot exceed 255 characters': 'La dirección no puede exceder 255 caracteres',
  'Complement cannot exceed 100 characters': 'El complemento no puede exceder 100 caracteres',
  'Postal code must have 5 digits': 'El código postal debe tener 5 dígitos',
  'City is required': 'La ciudad es obligatoria',
  'City cannot exceed 100 characters': 'La ciudad no puede exceder 100 caracteres',
  'Province is required': 'La provincia es obligatoria',
  'Province cannot exceed 100 characters': 'La provincia no puede exceder 100 caracteres',
  'Country is required': 'El país es obligatorio',
  'Country cannot exceed 50 characters': 'El país no puede exceder 50 caracteres',
  'Product name is required': 'El nombre del producto es obligatorio',
  'Name cannot exceed 200 characters': 'El nombre no puede exceder 200 caracteres',
  'Description is required': 'La descripción es obligatoria',
  'Description cannot exceed 5000 characters': 'La descripción no puede exceder 5000 caracteres',
  'Short description cannot exceed 255 characters': 'La descripción corta no puede exceder 255 caracteres',
  'Price must be greater than 0': 'El precio debe ser mayor que 0',
  'Maximum price allowed is 99999.99': 'El precio máximo permitido es 99999.99',
  'Previous price cannot be negative': 'El precio anterior no puede ser negativo',
  'Maximum previous price is 99999.99': 'El precio anterior máximo es 99999.99',
  'Stock must be an integer': 'El stock debe ser un número entero',
  'Stock cannot be negative': 'El stock no puede ser negativo',
  'Minimum stock must be at least 1': 'El stock mínimo debe ser al menos 1',
  'Invalid category ID': 'ID de categoría inválido',
  'Dimensions cannot exceed 50 characters': 'Las dimensiones no pueden exceder 50 caracteres',
  'Weight cannot be negative': 'El peso no puede ser negativo',
  'Time must be at least 1 minute': 'El tiempo debe ser de al menos 1 minuto',
  'Meta title cannot exceed 200 characters': 'El meta título no puede exceder 200 caracteres',
  'Meta description cannot exceed 300 characters': 'La meta descripción no puede exceder 300 caracteres',
  'Invalid product ID': 'ID de producto inválido',
  'Quantity must be an integer': 'La cantidad debe ser un número entero',
  'Quantity must be at least 1': 'La cantidad debe ser al menos 1',
  'Maximum quantity per product is 100': 'La cantidad máxima por producto es 100',
  'Order must contain at least one product': 'El pedido debe contener al menos un producto',
  'Invalid shipping address': 'Dirección de envío inválida',
  'Notes cannot exceed 1000 characters': 'Las notas no pueden exceder 1000 caracteres',
  'Cancellation reason is required': 'El motivo de cancelación es obligatorio',
  'Reason cannot exceed 500 characters': 'El motivo no puede exceder 500 caracteres',
  'Reason is required': 'El motivo es obligatorio',
  'Reason cannot exceed 255 characters': 'El motivo no puede exceder 255 caracteres',
  'Invalid order ID': 'ID de pedido inválido',
  'Quantity cannot be 0': 'La cantidad no puede ser 0',
  'Invalid image URL': 'URL de imagen inválida',
  'Filename is required': 'El nombre de archivo es obligatorio',
  'Alt text cannot exceed 255 characters': 'El texto alternativo no puede exceder 255 caracteres',
  'Maximum 5 images per product': 'Máximo 5 imágenes por producto',
  'Price cannot be negative': 'El precio no puede ser negativo',
  
  // API specific
  'Slug is required': 'El slug es obligatorio',
  'orderId is required': 'El ID de pedido es obligatorio',
  'Validation error in ${context}': 'Error de validación en ${context}',
  'No userId in session metadata': 'No hay userId en los metadatos de sesión',
  'Order not found for session:': 'Pedido no encontrado para sesión:',
  'Unhandled event type: ${event.type}': 'Tipo de evento no manejado: ${event.type}',
  'Invalid signature': 'Firma inválida',
  'PayPal credentials not configured': 'Credenciales de PayPal no configuradas',
  'Failed to get PayPal access token': 'Error al obtener token de acceso de PayPal',
  'Error loading cart': 'Error al cargar el carrito',
  'Error adding to cart': 'Error al añadir al carrito',
  'Error updating': 'Error al actualizar',
  'Error removing item': 'Error al eliminar artículo',
  'Producto eliminado': 'Producto eliminado',
  'Cliente eliminado': 'Cliente eliminado',
};

// ============================================================================
// FAQ TRANSLATIONS
// ============================================================================

export const faqTranslations: Record<string, { question: string; answer: string; category: string }> = {
  'FAQ-0001': {
    question: '¿Qué materiales usan para imprimir?',
    answer: 'Usamos principalmente PLA (plástico biodegradable a base de plantas) y PETG (más resistente y tolerante al calor). Ambos son seguros y ecológicos.',
    category: 'Materiales'
  },
  'FAQ-0002': {
    question: '¿Cuánto tarda el envío?',
    answer: 'El envío estándar tarda 3-5 días hábiles. El envío express se entrega en 1-2 días hábiles. Los pedidos superiores a 50€ califican para envío gratuito.',
    category: 'Envío'
  },
  'FAQ-0003': {
    question: '¿Puedo devolver o cambiar un producto?',
    answer: '¡Sí! Tienes 14 días desde la entrega para devolver cualquier producto en su estado original. Contáctanos en info@3dprint.com para iniciar una devolución.',
    category: 'Devoluciones'
  },
  'FAQ-0004': {
    question: '¿Aceptan pedidos personalizados?',
    answer: 'Actualmente solo ofrecemos productos de nuestro catálogo fijo. Los pedidos personalizados podrían estar disponibles en el futuro.',
    category: 'Pedidos'
  },
  'FAQ-0005': {
    question: '¿Cómo debo cuidar mis objetos impresos en 3D?',
    answer: 'Mantén alejados de la luz solar directa y fuentes de calor (especialmente los objetos de PLA). Limpia con un paño húmedo. Evita sumergir en agua.',
    category: 'Cuidado'
  },
  'FAQ-0006': {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard) y PayPal. Todos los pagos se procesan de forma segura a través de Stripe.',
    category: 'Pagos'
  },
  'FAQ-0007': {
    question: '¿Son seguros sus productos para niños?',
    answer: 'La mayoría de nuestros productos son aptos para niños mayores de 3 años. Consulta las descripciones individuales de productos para recomendaciones específicas de edad.',
    category: 'Seguridad'
  },
  'FAQ-0008': {
    question: '¿Hacen envíos internacionales?',
    answer: 'Actualmente solo enviamos dentro de España. El envío internacional estará disponible pronto.',
    category: 'Envío'
  }
};

// ============================================================================
// SHIPPING CONFIG TRANSLATIONS
// ============================================================================

export const shippingTranslations: Record<string, { name: string; description: string }> = {
  'SHIP-0001': {
    name: 'Envío Estándar',
    description: 'Entrega estándar en 3-5 días hábiles'
  },
  'SHIP-0002': {
    name: 'Envío Express',
    description: 'Entrega express en 1-2 días hábiles'
  },
  'SHIP-0003': {
    name: 'Envío Gratuito',
    description: 'Envío gratis para pedidos superiores a 50€'
  }
};

// ============================================================================
// SHIPPING ZONE TRANSLATIONS (for zones)
// ============================================================================

export const shippingZoneTranslations: Record<string, { name: string; country: string }> = {
  'ZONA-PENINSULA': {
    name: 'Península',
    country: 'España'
  },
  'ZONA-BALEARES': {
    name: 'Islas Baleares',
    country: 'España'
  },
  'ZONA-CANARIAS': {
    name: 'Islas Canarias',
    country: 'España'
  },
  'ZONA-CEUTA-MELILLA': {
    name: 'Ceuta y Melilla',
    country: 'España'
  }
};

// ============================================================================
// ALERT TRANSLATIONS
// ============================================================================

export const alertTranslations: Record<string, { title: string; message: string }> = {
  'ALRT-0001': {
    title: 'Stock bajo',
    message: 'Lámpara Lunar 3D tiene stock bajo (2 unidades)'
  },
  'ALRT-0002': {
    title: 'Stock bajo',
    message: 'Figura Articulada de Dinosaurio Rex tiene stock bajo (4 unidades)'
  }
};

// ============================================================================
// FAQ TRANSLATION HELPERS
// ============================================================================

export function translateFAQ(ref: string, field: 'question' | 'answer' | 'category'): string {
  return faqTranslations[ref]?.[field] || '';
}

export function translateShipping(ref: string, field: 'name' | 'description'): string {
  return shippingTranslations[ref]?.[field] || '';
}

export function translateAlert(ref: string, field: 'title' | 'message'): string {
  return alertTranslations[ref]?.[field] || '';
}

// ============================================================================
// PRODUCT & CATEGORY TRANSLATIONS
// ============================================================================

export const productTranslations: Record<string, { name: string; description: string; shortDescription: string }> = {
  'floral-decorative-vase': {
    name: 'Jarrón Decorativo Floral',
    description: 'Jarrón con diseño floral para decoración del hogar. Perfecto para flores artificiales o como pieza decorativa. Impreso en alta resolución para un acabado suave.',
    shortDescription: 'Elegante jarrón floral para decoración del hogar'
  },
  'hexagonal-desk-organizer': {
    name: 'Organizador de Escritorio Hexagonal',
    description: 'Organizador hexagonal modular para suministros de oficina. Cada módulo se puede combinar para crear configuraciones personalizadas. Incluye 3 piezas interconectadas.',
    shortDescription: 'Organizador modular de 3 piezas para escritorio'
  },
  'minimalist-geometric-planter': {
    name: 'Macetero Geométrico Minimalista',
    description: 'Macetero de diseño geométrico para plantas pequeñas. Cuenta con agujero de drenaje y estética angular moderna. Ideal para suculentas y cactus.',
    shortDescription: 'Macetero geométrico moderno con drenaje'
  },
  'adjustable-phone-stand': {
    name: 'Soporte Ajustable para Teléfono',
    description: 'Soporte para teléfono inteligente con ángulo ajustable. Compatible con todos los teléfonos de hasta 7 pulgadas. Cuenta con ranura para gestión de cables.',
    shortDescription: 'Soporte universal ajustable para teléfono'
  },
  'articulated-dinosaur-rex-figure': {
    name: 'Figura Articulada de Dinosaurio Rex',
    description: 'Figura de dinosaurio articulada para colección. 15 articulaciones móviles para poses realistas. Impreso en una pieza sin necesidad de ensamblaje.',
    shortDescription: 'T-Rex articulado con 15 puntos de movimiento'
  },
  'house-miniature': {
    name: 'Miniatura de Casa',
    description: 'Casa miniatura detallada para decoración. Estilo victoriano con techo extraíble. Perfecta para dioramas o estantes de exhibición.',
    shortDescription: 'Casa miniatura victoriana con techo extraíble'
  },
  'dragon-pencil-brush-holder': {
    name: 'Portalápices en Forma de Dragón',
    description: 'Portalápices/Lapiceros en forma de dragón estilizado. Escamas texturizadas y alas detalladas. Cabe lápices y pinceles estándar.',
    shortDescription: 'Organizador de escritorio en forma de dragón'
  },
  'articulated-classic-car': {
    name: 'Coche Clásico Articulado',
    description: 'Coche clásico articulado con ruedas móviles. Diseño vintage de los años 50 con puertas que se abren. Interior detallado y acabados cromados.',
    shortDescription: 'Coche vintage articulado con piezas móviles'
  },
  '3d-moon-lamp': {
    name: 'Lámpara Lunar 3D',
    description: 'Lámpara de noche LED con forma realista de luna. Incluye base recargable USB con atenuador táctil. Superficie lunar texturizada.',
    shortDescription: 'Lámpara lunar LED con base táctil'
  },
  'medieval-secret-box': {
    name: 'Caja Secreta Medieval',
    description: 'Caja secreta con mecanismo de acertijo estilo medieval. Compartimento oculto para pequeños objetos de valor. Ideal como regalo o para guardar secretos.',
    shortDescription: 'Caja con cerradura de acertijo medieval'
  }
};

export const categoryTranslations: Record<string, { name: string; description: string }> = {
  'decoration': {
    name: 'Decoración',
    description: 'Piezas decorativas para embellecer tu hogar u oficina'
  },
  'accessories': {
    name: 'Accesorios',
    description: 'Accesorios funcionales para el día a día'
  },
  'functional': {
    name: 'Funcional',
    description: 'Objetos prácticos y útiles para el hogar'
  },
  'articulated': {
    name: 'Articulados',
    description: 'Figuras y modelos con piezas móviles'
  },
  'toys': {
    name: 'Juguetes',
    description: 'Juguetes y figuras para coleccionistas'
  }
};

// ============================================================================
// PRODUCT TRANSLATION HELPERS
// ============================================================================

export function translateProductName(slug: string): string {
  return productTranslations[slug]?.name || slug;
}

export function translateProductDescription(slug: string): string {
  return productTranslations[slug]?.description || '';
}

export function translateProductShortDescription(slug: string): string {
  return productTranslations[slug]?.shortDescription || '';
}

export function translateCategoryName(slug: string): string {
  return categoryTranslations[slug]?.name || slug;
}

export function translateCategoryDescription(slug: string): string {
  return categoryTranslations[slug]?.description || '';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function translateOrderStatus(status: string): string {
  return enumTranslations.orderStatus[status] || status;
}

export function translatePaymentStatus(status: string): string {
  return enumTranslations.paymentStatus[status] || status;
}

export function translatePaymentMethod(method: string): string {
  return enumTranslations.paymentMethod[method] || method;
}

export function translateAlertType(type: string): string {
  return enumTranslations.alertType[type] || type;
}

export function translateAlertSeverity(severity: string): string {
  return enumTranslations.alertSeverity[severity] || severity;
}

export function translateAlertStatus(status: string): string {
  return enumTranslations.alertStatus[status] || status;
}

export function translateMovementType(type: string): string {
  return enumTranslations.movementType[type] || type;
}

export function translateCouponType(type: string): string {
  return enumTranslations.couponType[type] || type;
}

export function translateMaterial(material: string): string {
  return enumTranslations.material[material] || material;
}

// ============================================================================
// COUNTRY TRANSLATION
// ============================================================================

export function translateCountry(country: string): string {
  const countryTranslations: Record<string, string> = {
    'Spain': 'España',
    'United States': 'Estados Unidos',
    'United Kingdom': 'Reino Unido',
    'France': 'Francia',
    'Germany': 'Alemania',
    'Italy': 'Italia',
    'Portugal': 'Portugal',
    'Mexico': 'México',
    'Argentina': 'Argentina',
    'Chile': 'Chile',
    'Colombia': 'Colombia',
    'Peru': 'Perú',
    'Brazil': 'Brasil',
    'Andorra': 'Andorra',
    'Gibraltar': 'Gibraltar',
  };
  return countryTranslations[country] || country;
}

export function translateAddressName(name: string): string {
  return addressNameTranslations[name.toLowerCase()] || name;
}

export function translateShippingName(ref: string, field: 'name' | 'description'): string {
  return shippingTranslations[ref]?.[field] || '';
}

export function translateErrorMessage(message: string): string {
  // Direct lookup first
  if (errorMessages[message]) {
    return errorMessages[message];
  }
  
  // Handle template strings with variables
  for (const [english, spanish] of Object.entries(errorMessages)) {
    if (message.includes(english)) {
      return message.replace(english, spanish);
    }
  }
  
  return message;
}