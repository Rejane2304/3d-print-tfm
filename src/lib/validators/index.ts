import { z } from 'zod';
import { Material, Role, PaymentMethod, OrderStatus } from '@/types/prisma-enums';

// ============================================
// AUTHENTICATION VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'El teléfono debe estar en formato español: +34 600 123 456',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ============================================
// USER VALIDATIONS
// ============================================

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('Formato de email inválido'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'El teléfono debe estar en formato español: +34 600 123 456',
    }),
  taxId: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}[A-Z]$/.test(val), {
      message: 'El NIF debe tener 8 números y una letra mayúscula',
    }),
  fiscalName: z
    .string()
    .max(200, 'El nombre fiscal no puede exceder 200 caracteres')
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
    .min(1, 'El nombre de la dirección es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  recipient: z
    .string()
    .min(1, 'El nombre del destinatario es obligatorio')
    .max(100, 'El destinatario no puede exceder 100 caracteres'),
  phone: z
    .string()
    .regex(/^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/, 'El teléfono debe estar en formato español: +34 600 123 456'),
  address: z
    .string()
    .min(1, 'La dirección es obligatoria')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  complement: z
    .string()
    .max(100, 'El complemento no puede exceder 100 caracteres')
    .optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  city: z
    .string()
    .min(1, 'La ciudad es obligatoria')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
  province: z
    .string()
    .min(1, 'La provincia es obligatoria')
    .max(100, 'La provincia no puede exceder 100 caracteres'),
  country: z
    .string()
    .min(1, 'El país es obligatorio')
    .max(50, 'El país no puede exceder 50 caracteres')
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
    .min(1, 'El nombre del producto es obligatorio')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(5000, 'La descripción no puede exceder 5000 caracteres'),
  shortDescription: z
    .string()
    .max(255, 'La descripción corta no puede exceder 255 caracteres')
    .optional(),
  price: z
    .number()
    .min(0.01, 'El precio debe ser mayor que 0')
    .max(99999.99, 'El precio máximo permitido es 99999.99'),
  previousPrice: z
    .number()
    .min(0, 'El precio anterior no puede ser negativo')
    .max(99999.99, 'El precio anterior máximo es 99999.99')
    .optional()
    .nullable(),
  stock: z
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  minStock: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .min(1, 'El stock mínimo debe ser al menos 1')
    .default(5),
  categoryId: z.string().uuid('ID de categoría inválido').optional(),
  material: z.nativeEnum(Material).optional(),
  dimensions: z
    .string()
    .max(50, 'Las dimensiones no pueden exceder 50 caracteres')
    .optional(),
  weight: z
    .number()
    .min(0, 'El peso no puede ser negativo')
    .optional()
    .nullable(),
  printTime: z
    .number()
    .int('El tiempo debe ser un número entero')
    .min(1, 'El tiempo debe ser de al menos 1 minuto')
    .optional()
    .nullable(),
  metaTitle: z
    .string()
    .max(200, 'El meta título no puede exceder 200 caracteres')
    .optional(),
  metaDescription: z
    .string()
    .max(300, 'La meta descripción no puede exceder 300 caracteres')
    .optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const productUpdateSchema = productSchema.partial();

// ============================================
// ORDER VALIDATIONS
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser al menos 1')
    .max(100, 'La cantidad máxima por producto es 100'),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'El pedido debe contener al menos un producto'),
  shippingAddressId: z.string().uuid('Dirección de envío inválida'),
  customerNotes: z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  adminNotes: z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional(),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'El motivo de cancelación es obligatorio')
    .max(500, 'El motivo no puede exceder 500 caracteres'),
});

// ============================================
// PAYMENT VALIDATIONS
// ============================================

export const createPaymentSchema = z.object({
  orderId: z.string().uuid('ID de pedido inválido'),
  method: z.nativeEnum(PaymentMethod).optional(),
});

// ============================================
// INVENTORY VALIDATIONS
// ============================================

export const inventoryMovementSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .refine((val) => val !== 0, 'La cantidad no puede ser 0'),
  reason: z
    .string()
    .min(1, 'El motivo es obligatorio')
    .max(255, 'El motivo no puede exceder 255 caracteres'),
});

// ============================================
// IMAGE VALIDATIONS
// ============================================

export const productImageSchema = z.object({
  url: z.string().url('URL de imagen inválida'),
  filename: z.string().min(1, 'El nombre de archivo es obligatorio'),
  altText: z
    .string()
    .max(255, 'El texto alternativo no puede exceder 255 caracteres'),
  isMain: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(4, 'Máximo 5 imágenes por producto'),
});

// ============================================
// CONFIGURATION VALIDATIONS
// ============================================

export const shippingConfigSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  freeShippingFrom: z.number().min(0).optional().nullable(),
  minDays: z.number().int().min(1).default(1),
  maxDays: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

// ============================================
// CATEGORY VALIDATIONS
// ============================================

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la categoría es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es obligatorio')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  image: z
    .string()
    .max(500, 'La URL de imagen es muy larga')
    .optional()
    .nullable(),
  displayOrder: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema.partial();

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
export type ShippingConfigInput = z.infer<typeof shippingConfigSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;


