/**
 * Basic error handling system
 * To prevent unhandled errors from reaching the user
 */

// ============================================
// ERROR TYPES
// ============================================

export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_NOT_FOUND = 'DB_NOT_FOUND',
  DB_DUPLICATE_ENTRY = 'DB_DUPLICATE_ENTRY',
  
  // Business errors
  BUSINESS_INSUFFICIENT_STOCK = 'BUSINESS_INSUFFICIENT_STOCK',
  BUSINESS_INVALID_STATE = 'BUSINESS_INVALID_STATE',
  BUSINESS_PAYMENT_FAILED = 'BUSINESS_PAYMENT_FAILED',
  
  // Server errors
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
// CUSTOM ERROR CLASS
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
// COMMON ERRORS
// ============================================

export const Errors = {
  // Authentication
  invalidCredentials: () => 
    new ApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid email or password', 401),
   
  sessionExpired: () => 
    new ApiError(ErrorCode.AUTH_SESSION_EXPIRED, 'Session expired, please log in again', 401),
   
  unauthorized: () => 
    new ApiError(ErrorCode.AUTH_UNAUTHORIZED, 'You do not have permission to perform this action', 403),
   
  // Validation
  invalidInput: (field: string) => 
    new ApiError(ErrorCode.VALIDATION_INVALID_INPUT, `The field ${field} is not valid`, 400, field),
   
  requiredField: (field: string) => 
    new ApiError(ErrorCode.VALIDATION_REQUIRED_FIELD, `The field ${field} is required`, 400, field),
  
  // Database
  notFound: (resource: string) => 
    new ApiError(ErrorCode.DB_NOT_FOUND, `${resource} not found`, 404),
  
  duplicateEntry: (field: string) => 
    new ApiError(ErrorCode.DB_DUPLICATE_ENTRY, `Already exists a record with that ${field}`, 409, field),
  
  // Business
  insufficientStock: (product: string) => 
    new ApiError(ErrorCode.BUSINESS_INSUFFICIENT_STOCK, `Insufficient stock for ${product}`, 400),
  
  invalidState: (action: string, state: string) => 
    new ApiError(ErrorCode.BUSINESS_INVALID_STATE, `Cannot ${action} in state ${state}`, 400),
  
  paymentFailed: (reason: string) => 
    new ApiError(ErrorCode.BUSINESS_PAYMENT_FAILED, `Payment failed: ${reason}`, 400),
  
  // Server
  internalError: () => 
    new ApiError(ErrorCode.SERVER_INTERNAL_ERROR, 'Internal error of the server', 500),
  
  serviceUnavailable: () => 
    new ApiError(ErrorCode.SERVER_SERVICE_UNAVAILABLE, 'Service unavailable, try again later', 503),
};

// ============================================
// UTILITIES
// ============================================

export function handleError(error: unknown): ApiError {
  // If already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // If it's a standard Error
  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return Errors.internalError();
  }
  
  // Unknown error
  console.error('Unknown error:', error);
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
  return 'Error unknown';
}
