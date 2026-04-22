/**
 * Checkout API Service
 * Servicios para proceso de checkout y pagos
 * @module lib/api/services/checkout-api
 */

import { apiClient } from '@/lib/api/client';
import type {
  CheckoutRequest,
  CheckoutResponse,
  CreatePayPalPaymentRequest,
  CreatePayPalPaymentResponse,
  CreateStripePaymentRequest,
  CreateStripePaymentResponse,
  VerifyCheckoutRequest,
  VerifyCheckoutResponse,
} from '@/types/api';

/**
 * Errores específicos del dominio de checkout
 */
export class CheckoutError extends Error {
  constructor(
    message: string,
    public code:
      | 'CART_EMPTY'
      | 'INVALID_ADDRESS'
      | 'INVALID_PAYMENT_METHOD'
      | 'COUPON_ERROR'
      | 'STOCK_ERROR'
      | 'PAYMENT_FAILED'
      | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * Tipo de respuesta API exitosa
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Tipo de respuesta API con error
 */
interface ApiErrorResponse {
  success: false;
  error: string;
}

/**
 * Tipo unificado de respuesta API
 */
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Crea un pedido de checkout
 * @param shippingAddressId - ID de la dirección de envío
 * @param paymentMethod - Método de pago seleccionado
 * @param couponCode - Código de cupón opcional
 * @returns Información del pedido creado
 * @throws {CheckoutError} Si hay error al crear el checkout
 */
export async function createCheckout(
  shippingAddressId: string,
  paymentMethod: 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER',
  couponCode?: string,
): Promise<CheckoutResponse> {
  try {
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/api/checkout', {
      shippingAddressId,
      paymentMethod,
      couponCode,
    } as CheckoutRequest);

    if (!response.success) {
      // Detectar errores específicos
      const errorMsg = response.error.toLowerCase();
      if (errorMsg.includes('carrito') || errorMsg.includes('vacío')) {
        throw new CheckoutError(response.error, 'CART_EMPTY');
      }
      if (errorMsg.includes('dirección') || errorMsg.includes('address')) {
        throw new CheckoutError(response.error, 'INVALID_ADDRESS');
      }
      if (errorMsg.includes('stock') || errorMsg.includes('insuficiente')) {
        throw new CheckoutError(response.error, 'STOCK_ERROR');
      }
      if (errorMsg.includes('cupón') || errorMsg.includes('coupon')) {
        throw new CheckoutError(response.error, 'COUPON_ERROR');
      }
      throw new CheckoutError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al crear el pedido', 'UNKNOWN');
  }
}

/**
 * Verifica el estado de un checkout/pedido
 * @param orderId - ID del pedido
 * @returns Estado de verificación
 * @throws {CheckoutError} Si hay error al verificar
 */
export async function verifyCheckout(orderId: string): Promise<VerifyCheckoutResponse> {
  try {
    const response = await apiClient.post<ApiResponse<VerifyCheckoutResponse>>('/api/checkout/verify', {
      orderId,
    } as VerifyCheckoutRequest);

    if (!response.success) {
      throw new CheckoutError(response.error, 'UNKNOWN');
    }

    return response.data;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Error al verificar',
    };
  }
}

/**
 * Confirma el pago de un pedido
 * @param orderId - ID del pedido
 * @param options - Opciones de pago
 * @returns Confirmación del pago
 * @throws {CheckoutError} Si hay error al confirmar
 */
export async function confirmPayment(
  orderId: string,
  options: {
    paymentIntentId?: string;
    paypalOrderId?: string;
  } = {},
): Promise<{
  success: boolean;
  orderId: string;
  orderNumber: string;
  status: string;
  message: string;
}> {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        orderId: string;
        orderNumber: string;
        status: string;
      }>
    >('/api/checkout/confirm-payment', {
      orderId,
      paymentIntentId: options.paymentIntentId,
      paypalOrderId: options.paypalOrderId,
    });

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return {
      success: true,
      orderId: response.data.orderId,
      orderNumber: response.data.orderNumber,
      status: response.data.status,
      message: 'Pago confirmado correctamente',
    };
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al confirmar el pago', 'PAYMENT_FAILED');
  }
}

/**
 * Crea un pago con Stripe
 * @param orderId - ID del pedido
 * @returns Client secret para Stripe.js
 * @throws {CheckoutError} Si hay error al crear el pago
 */
export async function createStripePayment(orderId: string): Promise<CreateStripePaymentResponse> {
  try {
    const response = await apiClient.post<ApiResponse<CreateStripePaymentResponse>>('/api/payments/stripe/create', {
      orderId,
    } as CreateStripePaymentRequest);

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return response.data;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al crear el pago Stripe', 'PAYMENT_FAILED');
  }
}

/**
 * Crea un pago con PayPal
 * @param orderId - ID del pedido
 * @returns ID de la orden PayPal
 * @throws {CheckoutError} Si hay error al crear el pago
 */
export async function createPayPalPayment(orderId: string): Promise<CreatePayPalPaymentResponse> {
  try {
    const response = await apiClient.post<ApiResponse<CreatePayPalPaymentResponse>>('/api/payments/paypal/create', {
      orderId,
    } as CreatePayPalPaymentRequest);

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return response.data;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al crear el pago PayPal', 'PAYMENT_FAILED');
  }
}

/**
 * Captura un pago de PayPal
 * @param paypalOrderId - ID de la orden PayPal
 * @returns Resultado de la captura
 * @throws {CheckoutError} Si hay error al capturar
 */
export async function capturePayPalPayment(paypalOrderId: string): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        orderId: string;
        orderNumber: string;
      }>
    >('/api/paypal/capture-order', {
      orderId: paypalOrderId,
    });

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return {
      success: true,
      orderId: response.data.orderId,
      orderNumber: response.data.orderNumber,
    };
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(
      error instanceof Error ? error.message : 'Error al capturar el pago PayPal',
      'PAYMENT_FAILED',
    );
  }
}

/**
 * Verifica un pago de PayPal
 * @param paypalOrderId - ID de la orden PayPal
 * @returns Información de verificación
 * @throws {CheckoutError} Si hay error al verificar
 */
export async function verifyPayPalPayment(paypalOrderId: string): Promise<{
  valid: boolean;
  status?: string;
  amount?: number;
  error?: string;
}> {
  try {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/paypal/verify', {
      orderId: paypalOrderId,
    });

    if (!response.success) {
      return { valid: false, error: response.error };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Error al verificar',
    };
  }
}

/**
 * Inicia un pago por transferencia bancaria
 * @param orderId - ID del pedido
 * @returns Información para la transferencia
 * @throws {CheckoutError} Si hay error al iniciar
 */
export async function initBankTransfer(orderId: string): Promise<{
  success: boolean;
  reference?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
  };
  message: string;
}> {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        reference: string;
        bankDetails: {
          accountName: string;
          accountNumber: string;
          bankName: string;
          swiftCode?: string;
        };
      }>
    >('/api/payments/transfer/init', {
      orderId,
    });

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return {
      success: true,
      reference: response.data.reference,
      bankDetails: response.data.bankDetails,
      message: 'Datos de transferencia generados',
    };
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(
      error instanceof Error ? error.message : 'Error al iniciar transferencia',
      'PAYMENT_FAILED',
    );
  }
}

/**
 * Inicia un pago con Bizum
 * @param orderId - ID del pedido
 * @returns Información para el pago Bizum
 * @throws {CheckoutError} Si hay error al iniciar
 */
export async function initBizumPayment(orderId: string): Promise<{
  success: boolean;
  reference?: string;
  phoneNumber?: string;
  message: string;
}> {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        reference: string;
        phoneNumber: string;
      }>
    >('/api/payments/bizum/init', {
      orderId,
    });

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return {
      success: true,
      reference: response.data.reference,
      phoneNumber: response.data.phoneNumber,
      message: 'Datos de Bizum generados',
    };
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al iniciar Bizum', 'PAYMENT_FAILED');
  }
}

/**
 * Completa un pago (genérico)
 * @param orderId - ID del pedido
 * @param paymentData - Datos del pago
 * @returns Confirmación del pago
 * @throws {CheckoutError} Si hay error al completar
 */
export async function completePayment(
  orderId: string,
  paymentData: {
    method: 'STRIPE' | 'PAYPAL' | 'BIZUM' | 'TRANSFER';
    transactionId?: string;
  },
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/payments/complete', {
      orderId,
      ...paymentData,
    });

    if (!response.success) {
      throw new CheckoutError(response.error, 'PAYMENT_FAILED');
    }

    return {
      success: true,
      message: 'Pago completado correctamente',
    };
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(error instanceof Error ? error.message : 'Error al completar el pago', 'PAYMENT_FAILED');
  }
}

/**
 * Verifica si un error es de tipo CheckoutError
 */
export function isCheckoutError(error: unknown): error is CheckoutError {
  return error instanceof CheckoutError;
}

/**
 * Obtiene un mensaje de error amigable para checkout
 */
export function getCheckoutErrorMessage(error: unknown): string {
  if (isCheckoutError(error)) {
    switch (error.code) {
      case 'CART_EMPTY':
        return 'Tu carrito está vacío. Agrega productos antes de continuar.';
      case 'INVALID_ADDRESS':
        return 'Por favor, selecciona una dirección de envío válida.';
      case 'INVALID_PAYMENT_METHOD':
        return 'El método de pago seleccionado no es válido.';
      case 'COUPON_ERROR':
        return 'El cupón no es válido o ha expirado.';
      case 'STOCK_ERROR':
        return 'Algunos productos ya no tienen stock disponible.';
      case 'PAYMENT_FAILED':
        return 'El pago no pudo procesarse. Intenta nuevamente o usa otro método.';
      default:
        return error.message || 'Ha ocurrido un error al procesar tu pedido.';
    }
  }
  return 'Ha ocurrido un error inesperado.';
}
