/**
 * API Module
 * Módulo centralizado para comunicación con el backend
 * @module lib/api
 */

// Client
export { apiClient, ApiError, ApiNetworkError, ApiTimeoutError } from './client';
export { isApiError, isNetworkError, isTimeoutError, getUserFriendlyErrorMessage } from './client';

// Services
export * from './services';

// Hooks
export { useApiCart, useApiProducts, useApiProduct, useApiOrders, useApiOrder, useApiCheckout } from './hooks';

// Default export es el cliente
export { apiClient as default } from './client';
