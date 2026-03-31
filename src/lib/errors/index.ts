/**
 * Sistema de manejo de errores básico
 * Para evitar que errores no controlados lleguen al usuario
 */

// ============================================
// TIPOS DE ERROR
// ============================================

export enum ErrorCode {
  // Errores de autenticación
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Errores de validación
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  
  // Errores de base de datos
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_NOT_FOUND = 'DB_NOT_FOUND',
  DB_DUPLICATE_ENTRY = 'DB_DUPLICATE_ENTRY',
  
  // Errores de negocio
  BUSINESS_INSUFFICIENT_STOCK = 'BUSINESS_INSUFFICIENT_STOCK',
  BUSINESS_INVALID_STATE = 'BUSINESS_INVALID_STATE',
  BUSINESS_PAYMENT_FAILED = 'BUSINESS_PAYMENT_FAILED',
  
  // Errores del servidor
  SERVER_INTERNAL_ERROR = 'SERVER_INTERNAL_ERROR',
  SERVER_SERVICE_UNAVAILABLE = 'SERVER_SERVICE_UNAVAILABLE',
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  details?: string;
}

// ============================================
// CLASE DE ERROR PERSONALIZADA
// ============================================

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse(): ApiErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// ============================================
// ERRORES COMUNES
// ============================================

export const Errors = {
  // Autenticación
  invalidCredentials: () => 
    new ApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Email o contraseña incorrectos', 401),
  
  sessionExpired: () => 
    new ApiError(ErrorCode.AUTH_SESSION_EXPIRED, 'Sesión expirada, por favor inicia sesión nuevamente', 401),
  
  unauthorized: () => 
    new ApiError(ErrorCode.AUTH_UNAUTHORIZED, 'No tienes permisos para realizar esta acción', 403),
  
  // Validación
  invalidInput: (field: string) => 
    new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, `El campo ${field} no es válido`, 400, field),
  
  requiredField: (field: string) => 
    new ApiError(ErrorCode.VALIDATION_REQUIRED_FIELD, `El campo ${field} es requerido`, 400, field),
  
  // Base de datos
  notFound: (resource: string) => 
    new ApiError(ErrorCode.DB_NOT_FOUND, `${resource} no encontrado`, 404),
  
  duplicateEntry: (field: string) => 
    new ApiError(ErrorCode.DB_DUPLICATE_ENTRY, `Ya existe un registro con ese ${field}`, 409, field),
  
  // Negocio
  insufficientStock: (producto: string) => 
    new ApiError(ErrorCode.BUSINESS_INSUFFICIENT_STOCK, `Stock insuficiente para ${producto}`, 400),
  
  invalidState: (action: string, state: string) => 
    new ApiError(ErrorCode.BUSINESS_INVALID_STATE, `No se puede ${action} en estado ${state}`, 400),
  
  paymentFailed: (reason: string) => 
    new ApiError(ErrorCode.BUSINESS_PAYMENT_FAILED, `El pago falló: ${reason}`, 400),
  
  // Servidor
  internalError: () => 
    new ApiError(ErrorCode.SERVER_INTERNAL_ERROR, 'Error interno del servidor', 500),
  
  serviceUnavailable: () => 
    new ApiError(ErrorCode.SERVER_SERVICE_UNAVAILABLE, 'Servicio no disponible, intenta más tarde', 503),
};

// ============================================
// UTILIDADES
// ============================================

export function handleError(error: unknown): ApiError {
  // Si ya es un ApiError, devolverlo
  if (error instanceof ApiError) {
    return error;
  }
  
  // Si es un Error estándar
  if (error instanceof Error) {
    console.error('Error no controlado:', error);
    return Errors.internalError();
  }
  
  // Error desconocido
  console.error('Error desconocido:', error);
  return Errors.internalError();
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}
