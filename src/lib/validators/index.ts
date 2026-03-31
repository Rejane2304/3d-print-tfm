import { z } from 'zod';
import { Categoria, Material, Rol, MetodoPago, EstadoPedido } from '@prisma/client';

// ============================================
// VALIDACIONES DE AUTENTICACIÓN
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('El formato del email no es válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registroSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('El formato del email no es válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmarPassword: z.string(),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'El teléfono debe tener formato español: +34 600 123 456',
    }),
}).refine((data) => data.password === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNuevo: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmarPassword: z.string(),
}).refine((data) => data.passwordNuevo === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

// ============================================
// VALIDACIONES DE USUARIOS
// ============================================

export const usuarioSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  email: z
    .string()
    .email('El formato del email no es válido'),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val || /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'El teléfono debe tener formato español: +34 600 123 456',
    }),
  nif: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}[A-Z]$/.test(val), {
      message: 'El NIF debe tener 8 números y una letra mayúscula',
    }),
  nombreFiscal: z
    .string()
    .max(200, 'El nombre fiscal no puede exceder los 200 caracteres')
    .optional(),
  rol: z.nativeEnum(Rol).optional(),
  activo: z.boolean().default(true),
});

export const usuarioUpdateSchema = usuarioSchema.partial();

// ============================================
// VALIDACIONES DE DIRECCIONES
// ============================================

export const direccionSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la dirección es requerido')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  destinatario: z
    .string()
    .min(1, 'El nombre del destinatario es requerido')
    .max(100, 'El destinatario no puede exceder los 100 caracteres'),
  telefono: z
    .string()
    .regex(/^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/, 'El teléfono debe tener formato español: +34 600 123 456'),
  direccion: z
    .string()
    .min(1, 'La dirección es requerida')
    .max(255, 'La dirección no puede exceder los 255 caracteres'),
  complemento: z
    .string()
    .max(100, 'El complemento no puede exceder los 100 caracteres')
    .optional(),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  ciudad: z
    .string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder los 100 caracteres'),
  provincia: z
    .string()
    .min(1, 'La provincia es requerida')
    .max(100, 'La provincia no puede exceder los 100 caracteres'),
  pais: z
    .string()
    .min(1, 'El país es requerido')
    .max(50, 'El país no puede exceder los 50 caracteres')
    .default('España'),
  esPrincipal: z.boolean().default(false),
});

export const direccionUpdateSchema = direccionSchema.partial();

// ============================================
// VALIDACIONES DE PRODUCTOS
// ============================================

export const productoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del producto es requerido')
    .max(200, 'El nombre no puede exceder los 200 caracteres'),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(5000, 'La descripción no puede exceder los 5000 caracteres'),
  descripcionCorta: z
    .string()
    .max(255, 'La descripción corta no puede exceder los 255 caracteres')
    .optional(),
  precio: z
    .number()
    .min(0.01, 'El precio debe ser mayor a 0')
    .max(99999.99, 'El precio máximo permitido es 99999.99'),
  precioAnterior: z
    .number()
    .min(0, 'El precio anterior no puede ser negativo')
    .max(99999.99, 'El precio anterior máximo es 99999.99')
    .optional()
    .nullable(),
  stock: z
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  stockMinimo: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .min(1, 'El stock mínimo debe ser al menos 1')
    .default(5),
  categoria: z.nativeEnum(Categoria).optional(),
  material: z.nativeEnum(Material).optional(),
  dimensiones: z
    .string()
    .max(50, 'Las dimensiones no pueden exceder los 50 caracteres')
    .optional(),
  peso: z
    .number()
    .min(0, 'El peso no puede ser negativo')
    .optional()
    .nullable(),
  tiempoImpresion: z
    .number()
    .int('El tiempo debe ser un número entero')
    .min(1, 'El tiempo debe ser al menos 1 minuto')
    .optional()
    .nullable(),
  metaTitulo: z
    .string()
    .max(200, 'El meta título no puede exceder los 200 caracteres')
    .optional(),
  metaDescripcion: z
    .string()
    .max(300, 'La meta descripción no puede exceder los 300 caracteres')
    .optional(),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
});

export const productoUpdateSchema = productoSchema.partial();

// ============================================
// VALIDACIONES DE PEDIDOS
// ============================================

export const itemPedidoSchema = z.object({
  productoId: z.string().uuid('ID de producto inválido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser al menos 1')
    .max(100, 'La cantidad máxima por producto es 100'),
});

export const crearPedidoSchema = z.object({
  items: z
    .array(itemPedidoSchema)
    .min(1, 'El pedido debe contener al menos un producto'),
  direccionEnvioId: z.string().uuid('Dirección de envío inválida'),
  notas: z
    .string()
    .max(1000, 'Las notas no pueden exceder los 1000 caracteres')
    .optional(),
});

export const actualizarEstadoPedidoSchema = z.object({
  estado: z.nativeEnum(EstadoPedido).optional(),
  notas: z
    .string()
    .max(1000, 'Las notas no pueden exceder los 1000 caracteres')
    .optional(),
});

export const cancelarPedidoSchema = z.object({
  motivo: z
    .string()
    .min(1, 'El motivo de cancelación es requerido')
    .max(500, 'El motivo no puede exceder los 500 caracteres'),
});

// ============================================
// VALIDACIONES DE PAGOS
// ============================================

export const crearPagoSchema = z.object({
  pedidoId: z.string().uuid('ID de pedido inválido'),
  metodo: z.nativeEnum(MetodoPago).optional(),
});

// ============================================
// VALIDACIONES DE INVENTARIO
// ============================================

export const movimientoInventarioSchema = z.object({
  productoId: z.string().uuid('ID de producto inválido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .refine((val) => val !== 0, 'La cantidad no puede ser 0'),
  motivo: z
    .string()
    .min(1, 'El motivo es requerido')
    .max(255, 'El motivo no puede exceder los 255 caracteres'),
});

// ============================================
// VALIDACIONES DE IMÁGENES
// ============================================

export const imagenProductoSchema = z.object({
  url: z.string().url('La URL de la imagen no es válida'),
  nombreArchivo: z.string().min(1, 'El nombre del archivo es requerido'),
  textoAlt: z
    .string()
    .max(255, 'El texto alternativo no puede exceder los 255 caracteres'),
  esPrincipal: z.boolean().default(false),
  orden: z.number().int().min(0).max(4, 'Máximo 5 imágenes por producto'),
});

// ============================================
// VALIDACIONES DE CONFIGURACIÓN
// ============================================

export const configuracionEnvioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(500).optional(),
  precio: z.number().min(0, 'El precio no puede ser negativo'),
  envioGratisDesde: z.number().min(0).optional().nullable(),
  diasMinimos: z.number().int().min(1).default(1),
  diasMaximos: z.number().int().min(1).default(5),
  activo: z.boolean().default(true),
  esDefecto: z.boolean().default(false),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type UsuarioInput = z.infer<typeof usuarioSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
export type DireccionInput = z.infer<typeof direccionSchema>;
export type ProductoInput = z.infer<typeof productoSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
export type ActualizarEstadoPedidoInput = z.infer<typeof actualizarEstadoPedidoSchema>;
export type CancelarPedidoInput = z.infer<typeof cancelarPedidoSchema>;
export type MovimientoInventarioInput = z.infer<typeof movimientoInventarioSchema>;
export type ImagenProductoInput = z.infer<typeof imagenProductoSchema>;
