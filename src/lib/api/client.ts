/**
 * API Client Centralizado
 * Cliente HTTP con manejo de errores, timeouts, retries y refresh de token
 * @module lib/api/client
 */

import { ApiErrorCode, type ApiErrorResponse, type ApiRequestOptions } from '@/types/api';

/**
 * Error de API con información detallada del error HTTP
 */
export class ApiError extends Error {
  /** Código HTTP del error */
  status: number;
  /** Datos adicionales del error */
  data: unknown;
  /** Código de error interno */
  code: ApiErrorCode;

  constructor(message: string, status: number, data?: unknown, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code ?? ApiErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Error de timeout
 */
export class ApiTimeoutError extends ApiError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, 0, null, ApiErrorCode.TIMEOUT);
    this.name = 'ApiTimeoutError';
  }
}

/**
 * Error de red (sin conexión, DNS, etc.)
 */
export class ApiNetworkError extends ApiError {
  constructor(originalError: Error) {
    super(originalError.message, 0, null, ApiErrorCode.NETWORK_ERROR);
    this.name = 'ApiNetworkError';
  }
}

// ============================================================================
// Configuration
// ============================================================================

/** Configuración por defecto del cliente */
const DEFAULT_CONFIG = {
  timeout: 30000, // 30 segundos
  retries: 2,
  retryDelay: 1000, // 1 segundo
  retryStatusCodes: [408, 429, 500, 502, 503, 504] as number[],
};

/** Obtiene la base URL del API */
function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: usar URL absoluta
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }
  // Client-side: usar ruta relativa
  return '';
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Obtiene el token CSRF de las cookies
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Refresca el token de sesión si es necesario
 * Nota: Next-auth maneja el refresh automáticamente
 */
// async function refreshTokenIfNeeded(): Promise<boolean> {
//   // Next-auth maneja el token automáticamente
//   // Esta función está disponible para implementación futura
//   return true;
// }

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Construye la URL completa del endpoint
 */
function buildUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Construye los headers por defecto para las peticiones
 */
function buildHeaders(customHeaders?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  // Agregar token CSRF si existe
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // Mezclar headers personalizados
  if (customHeaders) {
    const custom = customHeaders as Record<string, string>;
    Object.entries(custom).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  return headers;
}

/**
 * Parsea la respuesta JSON de forma segura
 */
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Determina si un código de status requiere retry
 */
function shouldRetry(status: number, retryStatusCodes: number[]): boolean {
  return retryStatusCodes.includes(status);
}

/**
 * Espera un tiempo determinado (delay)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Request Function
// ============================================================================

/**
 * Ejecuta una petición HTTP con manejo de errores y retry
 */
async function executeRequest<T>(url: string, options: RequestInit, apiOptions: ApiRequestOptions): Promise<T> {
  const {
    timeout = DEFAULT_CONFIG.timeout,
    retries = DEFAULT_CONFIG.retries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
  } = apiOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parsear respuesta
      const data = await parseResponse(response);

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = data as ApiErrorResponse | undefined;
        const errorCode = mapStatusToErrorCode(response.status);

        // Si es un error retryable y tenemos intentos restantes
        if (shouldRetry(response.status, DEFAULT_CONFIG.retryStatusCodes) && attempt < retries) {
          lastError = new ApiError(errorData?.error ?? `HTTP ${response.status}`, response.status, data, errorCode);
          await delay(retryDelay * (attempt + 1)); // Backoff exponencial simple
          continue;
        }

        throw new ApiError(errorData?.error ?? `HTTP ${response.status}`, response.status, data, errorCode);
      }

      // Retornar datos exitosos
      return data as T;
    } catch (error) {
      // Manejar timeout
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < retries) {
          lastError = new ApiTimeoutError(timeout);
          await delay(retryDelay * (attempt + 1));
          continue;
        }
        throw new ApiTimeoutError(timeout);
      }

      // Manejar errores de red
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiNetworkError(error);
      }

      // Re-lanzar errores de API ya manejados
      if (error instanceof ApiError) {
        throw error;
      }

      // Error desconocido
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        error,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }
  }

  // Si agotamos los reintentos, lanzar el último error
  throw lastError ?? new ApiError('Max retries exceeded', 0, null, ApiErrorCode.NETWORK_ERROR);
}

/**
 * Mapea códigos HTTP a códigos de error internos
 */
function mapStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 422:
    case 400:
      return ApiErrorCode.VALIDATION_ERROR;
    case 408:
      return ApiErrorCode.TIMEOUT;
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}

// ============================================================================
// API Client Methods
// ============================================================================

/**
 * Cliente API centralizado con métodos HTTP
 */
export const apiClient = {
  /**
   * Realiza una petición GET
   * @param endpoint - Ruta del endpoint (ej: '/api/products')
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   * @throws {ApiError} Si la petición falla
   * @throws {ApiTimeoutError} Si excede el timeout
   * @throws {ApiNetworkError} Si hay error de red
   */
  async get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method: 'GET',
        headers,
        credentials: 'include', // Incluir cookies para auth
      },
      options,
    );
  },

  /**
   * Realiza una petición POST
   * @param endpoint - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   */
  async post<T>(endpoint: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      },
      options,
    );
  },

  /**
   * Realiza una petición PATCH
   * @param endpoint - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   */
  async patch<T>(endpoint: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      },
      options,
    );
  },

  /**
   * Realiza una petición PUT
   * @param endpoint - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   */
  async put<T>(endpoint: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      },
      options,
    );
  },

  /**
   * Realiza una petición DELETE
   * @param endpoint - Ruta del endpoint
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   */
  async delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method: 'DELETE',
        headers,
        credentials: 'include',
      },
      options,
    );
  },

  /**
   * Realiza una petición con método personalizado
   * @param method - Método HTTP
   * @param endpoint - Ruta del endpoint
   * @param body - Cuerpo de la petición (opcional)
   * @param options - Opciones adicionales de fetch y API
   * @returns Promise con los datos tipados
   */
  async request<T>(method: string, endpoint: string, body?: unknown, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options.headers);

    return executeRequest<T>(
      url,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      },
      options,
    );
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Verifica si un error es de tipo ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Verifica si un error es de timeout
 */
export function isTimeoutError(error: unknown): error is ApiTimeoutError {
  return error instanceof ApiTimeoutError;
}

/**
 * Verifica si un error es de red
 */
export function isNetworkError(error: unknown): error is ApiNetworkError {
  return error instanceof ApiNetworkError;
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    switch (error.code) {
      case ApiErrorCode.UNAUTHORIZED:
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      case ApiErrorCode.FORBIDDEN:
        return 'No tienes permiso para realizar esta acción.';
      case ApiErrorCode.NOT_FOUND:
        return 'El recurso solicitado no existe.';
      case ApiErrorCode.VALIDATION_ERROR:
        return 'Por favor, verifica los datos ingresados.';
      case ApiErrorCode.INSUFFICIENT_STOCK:
        return 'No hay suficiente stock disponible.';
      case ApiErrorCode.INVALID_COUPON:
        return 'El cupón no es válido o ha expirado.';
      case ApiErrorCode.PAYMENT_FAILED:
        return 'El pago no pudo procesarse. Intenta nuevamente.';
      case ApiErrorCode.TIMEOUT:
        return 'La operación tardó demasiado. Por favor, intenta nuevamente.';
      case ApiErrorCode.NETWORK_ERROR:
        return 'Error de conexión. Verifica tu conexión a internet.';
      default:
        return error.message || 'Ha ocurrido un error inesperado.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado.';
}

export default apiClient;
