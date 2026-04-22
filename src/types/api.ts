/**
 * API Types
 * Tipos compartidos para comunicación API-Frontend
 * @module types/api
 */

import type {
  Address,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  Cart,
  Category,
  Coupon,
  CouponType,
  Material,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductImage,
  Review,
  Role,
  User,
} from '@prisma/client';

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Estructura base de respuesta API exitosa
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Estructura de respuesta API con error
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

/**
 * Tipo unificado para respuestas API (usado en servicios)
 * Combina éxito y error en un tipo con discriminación por success
 */
export type ApiResponse<T> =
  | { success: true; data: T; message?: string; error?: never; details?: never }
  | { success: false; error: string; details?: Record<string, string[]>; data?: never };

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Metadatos de paginación
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parámetros de paginación para peticiones
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Cart Types
// ============================================================================

/**
 * Item del carrito con información del producto
 */
export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    image: string | null;
  };
}

/**
 * Datos completos del carrito
 */
export interface CartResponse {
  id: string | null;
  items: CartItemResponse[];
  subtotal: number;
  totalItems: number;
}

/**
 * Request para agregar item al carrito
 */
export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

/**
 * Request para actualizar item del carrito
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

// ============================================================================
// Product Types
// ============================================================================

/**
 * Producto con información traducida
 */
export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  stock: number;
  material: Material | null;
  weight: number | null;
  dimensions: string | null;
  isActive: boolean;
  images: ProductImageResponse[];
  category: CategoryResponse | null;
}

/**
 * Imagen de producto simplificada
 */
export interface ProductImageResponse {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
}

/**
 * Categoría con información traducida
 */
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

/**
 * Respuesta de lista de productos
 */
export interface ProductsListResponse extends PaginatedResponse<ProductResponse> {
  filters: ProductFilters;
}

/**
 * Filtros disponibles para productos
 */
export interface ProductFilters {
  category?: string;
  material?: Material | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: string;
  search?: string | null;
}

/**
 * Parámetros de búsqueda de productos
 */
export interface ProductSearchParams extends PaginationParams {
  category?: string;
  material?: Material;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'nombre' | 'precio';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================================
// Order Types
// ============================================================================

/**
 * Item de pedido con información del producto
 */
export interface OrderItemResponse {
  id: string;
  quantity: number;
  unitPrice: number;
  producto: {
    nombre: string;
    slug: string;
    images: { url: string }[];
  };
}

/**
 * Información de pago del pedido
 */
export interface OrderPaymentResponse {
  estado: string;
  metodo: string;
}

/**
 * Información de factura del pedido
 */
export interface OrderInvoiceResponse {
  id: string;
  numeroFactura: string;
  anulada: boolean;
}

/**
 * Pedido completo (formato español para frontend)
 */
export interface OrderResponse {
  id: string;
  numeroPedido: string;
  estado: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: Date;
  items: OrderItemResponse[];
  factura?: OrderInvoiceResponse;
  pago?: OrderPaymentResponse;
}

/**
 * Lista de pedidos del usuario
 */
export interface OrdersListResponse {
  pedidos: OrderResponse[];
}

/**
 * Respuesta de lista de categorías
 */
export interface CategoriesListResponse {
  categories: CategoryResponse[];
}

/**
 * Detalle completo del pedido
 */
export interface OrderDetailResponse extends OrderResponse {
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingComplement: string | null;
  shippingPostalCode: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingCountry: string | null;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
}

// ============================================================================
// Checkout Types
// ============================================================================

/**
 * Request para crear checkout/pedido
 */
export interface CheckoutRequest {
  shippingAddressId: string;
  paymentMethod: 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER';
  couponCode?: string;
}

/**
 * Respuesta de checkout exitoso
 */
export interface CheckoutResponse {
  orderId: string;
  paymentId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  discount?: number;
  message: string;
}

/**
 * Request para verificar checkout
 */
export interface VerifyCheckoutRequest {
  orderId: string;
}

/**
 * Respuesta de verificación de checkout
 */
export interface VerifyCheckoutResponse {
  valid: boolean;
  order?: OrderDetailResponse;
  error?: string;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * Datos del usuario (perfil público)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  taxId: string | null;
  role: Role;
  createdAt: Date;
}

/**
 * Request para actualizar perfil
 */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  taxId?: string;
}

/**
 * Request para cambiar contraseña
 */
export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNuevo: string;
}

// ============================================================================
// Address Types
// ============================================================================

/**
 * Dirección completa
 */
export interface AddressResponse {
  id: string;
  userId: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement: string | null;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  isDefault: boolean;
}

/**
 * Request para crear dirección
 */
export interface CreateAddressRequest {
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement?: string;
  postalCode: string;
  city: string;
  province: string;
  country?: string;
  isDefault?: boolean;
}

/**
 * Request para actualizar dirección
 */
export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

/**
 * Lista de direcciones del usuario
 */
export interface AddressesListResponse {
  addresses: AddressResponse[];
}

// ============================================================================
// Payment Types
// ============================================================================

/**
 * Pago completo
 */
export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
}

/**
 * Request para crear pago Stripe
 */
export interface CreateStripePaymentRequest {
  orderId: string;
}

/**
 * Respuesta de creación de pago Stripe
 */
export interface CreateStripePaymentResponse {
  clientSecret: string;
}

/**
 * Request para crear pago PayPal
 */
export interface CreatePayPalPaymentRequest {
  orderId: string;
}

/**
 * Respuesta de creación de pago PayPal
 */
export interface CreatePayPalPaymentResponse {
  orderId: string;
  approvalUrl?: string;
}

// ============================================================================
// Invoice Types
// ============================================================================

/**
 * Factura completa
 */
export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issueDate: Date;
  subtotal: number;
  taxAmount: number;
  total: number;
  isCancelled: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
}

// ============================================================================
// Coupon Types
// ============================================================================

/**
 * Cupón completo
 */
export interface CouponResponse {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

/**
 * Request para validar cupón
 */
export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
}

/**
 * Respuesta de validación de cupón
 */
export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: CouponResponse;
  discount?: number;
  hasFreeShipping?: boolean;
  error?: string;
}

/**
 * Request para aplicar cupón
 */
export interface ApplyCouponRequest {
  code: string;
}

// ============================================================================
// Review Types
// ============================================================================

/**
 * Reseña completa
 */
export interface ReviewResponse {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

/**
 * Request para crear reseña
 */
export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

/**
 * Resumen de reseñas de producto
 */
export interface ProductReviewsSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Alerta completa
 */
export interface AlertResponse {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  productId?: string;
  orderId?: string;
  reviewId?: string;
  userId?: string;
  couponId?: string;
  status: AlertStatus;
  resolvedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Return Types
// ============================================================================

/**
 * Solicitud de devolución
 */
export interface ReturnResponse {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: ReturnItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item de devolución
 */
export interface ReturnItemResponse {
  id: string;
  orderItemId: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Request para crear devolución
 */
export interface CreateReturnRequest {
  orderId: string;
  reason: string;
  items: {
    orderItemId: string;
    quantity: number;
    reason: string;
  }[];
}

// ============================================================================
// Shipping Types
// ============================================================================

/**
 * Zona de envío
 */
export interface ShippingZoneResponse {
  id: string;
  name: string;
  country: string;
  baseCost: number;
  freeShippingThreshold: number | null;
  postalCodePrefixes: string[];
  isActive: boolean;
}

/**
 * Request para calcular envío
 */
export interface CalculateShippingRequest {
  addressId: string;
  subtotal: number;
}

/**
 * Respuesta de cálculo de envío
 */
export interface CalculateShippingResponse {
  cost: number;
  isFree: boolean;
  zone: ShippingZoneResponse;
}

// ============================================================================
// Site Config Types
// ============================================================================

/**
 * Configuración del sitio
 */
export interface SiteConfigResponse {
  siteName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Códigos de error de la API
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_COUPON = 'INVALID_COUPON',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Error específico de dominio
 */
export interface DomainError {
  code: ApiErrorCode;
  message: string;
  field?: string;
}

// ============================================================================
// Generic API Types
// ============================================================================

/**
 * Opciones de petición API
 */
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Estado de carga de una petición API
 */
export interface ApiLoadingState {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Resultado de mutación API
 */
export interface ApiMutationResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}
