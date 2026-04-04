import { z } from 'zod';
import { Material, Role, PaymentMethod, OrderStatus } from '@/types/prisma-enums';

// ============================================
// AUTHENTICATION VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase, one lowercase and one number'),
  confirmPassword: z.string(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'Phone must be in Spanish format: +34 600 123 456',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase, one lowercase and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// USER VALIDATIONS
// ============================================

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .email('Invalid email format'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'Phone must be in Spanish format: +34 600 123 456',
    }),
  taxId: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}[A-Z]$/.test(val), {
      message: 'Tax ID must have 8 numbers and one uppercase letter',
    }),
  fiscalName: z
    .string()
    .max(200, 'Fiscal name cannot exceed 200 characters')
    .optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userSchema.partial();

// ============================================
// ADDRESS VALIDATIONS
// ============================================

export const addressSchema = z.object({
  name: z
    .string()
    .min(1, 'Address name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  recipient: z
    .string()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient cannot exceed 100 characters'),
  phone: z
    .string()
    .regex(/^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/, 'Phone must be in Spanish format: +34 600 123 456'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address cannot exceed 255 characters'),
  complement: z
    .string()
    .max(100, 'Complement cannot exceed 100 characters')
    .optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Postal code must have 5 digits'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),
  province: z
    .string()
    .min(1, 'Province is required')
    .max(100, 'Province cannot exceed 100 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(50, 'Country cannot exceed 50 characters')
    .default('Spain'),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressSchema.partial();

// ============================================
// PRODUCT VALIDATIONS
// ============================================

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  shortDescription: z
    .string()
    .max(255, 'Short description cannot exceed 255 characters')
    .optional(),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(99999.99, 'Maximum price allowed is 99999.99'),
  previousPrice: z
    .number()
    .min(0, 'Previous price cannot be negative')
    .max(99999.99, 'Maximum previous price is 99999.99')
    .optional()
    .nullable(),
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
  minStock: z
    .number()
    .int('Minimum stock must be an integer')
    .min(1, 'Minimum stock must be at least 1')
    .default(5),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  material: z.nativeEnum(Material).optional(),
  dimensions: z
    .string()
    .max(50, 'Dimensions cannot exceed 50 characters')
    .optional(),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .optional()
    .nullable(),
  printTime: z
    .number()
    .int('Time must be an integer')
    .min(1, 'Time must be at least 1 minute')
    .optional()
    .nullable(),
  metaTitle: z
    .string()
    .max(200, 'Meta title cannot exceed 200 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(300, 'Meta description cannot exceed 300 characters')
    .optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const productUpdateSchema = productSchema.partial();

// ============================================
// ORDER VALIDATIONS
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Maximum quantity per product is 100'),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one product'),
  shippingAddressId: z.string().uuid('Invalid shipping address'),
  customerNotes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  adminNotes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'Cancellation reason is required')
    .max(500, 'Reason cannot exceed 500 characters'),
});

// ============================================
// PAYMENT VALIDATIONS
// ============================================

export const createPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  method: z.nativeEnum(PaymentMethod).optional(),
});

// ============================================
// INVENTORY VALIDATIONS
// ============================================

export const inventoryMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .refine((val) => val !== 0, 'Quantity cannot be 0'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(255, 'Reason cannot exceed 255 characters'),
});

// ============================================
// IMAGE VALIDATIONS
// ============================================

export const productImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  filename: z.string().min(1, 'Filename is required'),
  altText: z
    .string()
    .max(255, 'Alt text cannot exceed 255 characters'),
  isMain: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(4, 'Maximum 5 images per product'),
});

// ============================================
// CONFIGURATION VALIDATIONS
// ============================================

export const shippingConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  freeShippingFrom: z.number().min(0).optional().nullable(),
  minDays: z.number().int().min(1).default(1),
  maxDays: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

// ============================================
// EXPORTED TYPES
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;

// Legacy aliases for backward compatibility (deprecated - will be removed in future versions)
export const registroSchema = registerSchema;
export const usuarioSchema = userSchema;
export const direccionSchema = addressSchema;
export const productoSchema = productSchema;
export const crearPedidoSchema = createOrderSchema;
export const actualizarEstadoPedidoSchema = updateOrderStatusSchema;
export const cancelarPedidoSchema = cancelOrderSchema;
export const movimientoInventarioSchema = inventoryMovementSchema;
export const imagenProductoSchema = productImageSchema;
export const configuracionEnvioSchema = shippingConfigSchema;

// Spanish type aliases (deprecated - will be removed in future versions)
export type RegistroInput = RegisterInput;
export type UsuarioInput = UserInput;
export type DireccionInput = AddressInput;
export type ProductoInput = ProductInput;
export type CrearPedidoInput = CreateOrderInput;
export type ActualizarEstadoPedidoInput = UpdateOrderStatusInput;
export type CancelarPedidoInput = CancelOrderInput;
export type MovimientoInventarioInput = InventoryMovementInput;
export type ImagenProductoInput = ProductImageInput;
