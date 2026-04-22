/**
 * API Services Index
 * Exporta todos los servicios API
 * @module lib/api/services
 */

export * from './cart-api';
export * from './products-api';
export * from './orders-api';
export * from './checkout-api';
export * from './user-api';

// Default export
export { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from './cart-api';
