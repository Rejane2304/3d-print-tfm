/**
 * Backend Translation Module
 * Traducción 100% en backend antes de enviar a frontend
 * 
 * Arquitectura:
 * - BD: Inglés (PENDING, COMPLETED, etc.)
 * - Código: Inglés (getOrders, createUser, etc.)
 * - API Routes: Transforman inglés → español
 * - Frontend: Recibe español directamente
 * - UI: 100% español
 */

// ============================================================================
// ENUM TRANSLATIONS - Estados, métodos, tipos
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
// SHIPPING CONFIG TRANSLATIONS
// ============================================================================

export const shippingTranslations: TranslationMap = {
  'Standard Shipping': 'Envío Estándar',
  'Express Shipping': 'Envío Express',
  'Free Shipping': 'Envío Gratuito',
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

export function translateAddressName(name: string): string {
  return addressNameTranslations[name.toLowerCase()] || name;
}

export function translateShippingName(name: string): string {
  return shippingTranslations[name] || name;
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