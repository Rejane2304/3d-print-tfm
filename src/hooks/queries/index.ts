/**
 * React Query Hooks Index
 * Exporta todos los hooks de queries desde un solo archivo
 */

// Product hooks
export {
  useProducts,
  useProduct,
  prefetchProducts,
  prefetchProduct,
  type ProductFilters,
  type Product,
  type ProductsResponse,
} from './useProducts';

// Cart hooks (complementario a useCart.ts)
export {
  useCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  type CartItem,
  type CartData,
} from './useCart';

// Orders hooks
export {
  useOrders,
  useOrder,
  useCancelOrderMutation,
  prefetchOrders,
  prefetchOrder,
  type Order,
  type OrderItem,
  type OrderDetail,
} from './useOrders';

// User hooks
export {
  useProfile,
  useUpdateProfileMutation,
  useAddresses,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  prefetchProfile,
  prefetchAddresses,
  type UserProfile,
  type Address,
} from './useUser';

// Checkout hooks
export {
  useCreateCheckout,
  useVerifyCheckout,
  useConfirmPaymentMutation,
  type CheckoutInput,
  type CheckoutData,
  type PaymentVerification,
} from './useCheckout';

// Admin Products hooks
export {
  useAdminProducts,
  useAdminProduct,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  prefetchAdminProducts,
  type AdminProduct,
  type CreateProductInput,
} from './useAdminProducts';

// Admin Orders hooks
export {
  useAdminOrders,
  useAdminOrder,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  prefetchAdminOrders,
  type AdminOrder,
  type AdminOrderDetail,
} from './useAdminOrders';
