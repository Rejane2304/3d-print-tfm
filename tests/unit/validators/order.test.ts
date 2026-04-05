/**
 * Order Validators Tests
 * Tests for actual Zod schemas from @/lib/validators
 */
import { describe, it, expect } from 'vitest';
import {
  orderItemSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from '@/lib/validators';
import { OrderStatus } from '@/types/prisma-enums';

describe('Order Validators', () => {
  describe('orderItemSchema', () => {
    it('should accept valid order item', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid productId format', () => {
      const result = orderItemSchema.safeParse({
        productId: 'not-a-uuid',
        quantity: 2,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('ID de producto inválido');
      }
    });

    it('should reject quantity of zero', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La cantidad debe ser al menos 1');
      }
    });

    it('should reject negative quantity', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: -5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La cantidad debe ser al menos 1');
      }
    });

    it('should reject quantity greater than 100', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 101,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La cantidad máxima por producto es 100');
      }
    });

    it('should accept quantity of exactly 100', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should accept quantity of 1 (minimum)', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject decimal quantity', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La cantidad debe ser un número entero');
      }
    });

    it('should reject missing productId', () => {
      const result = orderItemSchema.safeParse({
        quantity: 2,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const result = orderItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createOrderSchema', () => {
    const validOrder = {
      items: [
        { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 },
        { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
      ],
      shippingAddressId: '550e8400-e29b-41d4-a716-446655440002',
      customerNotes: 'Por favor, entregar por la mañana. Timbre en la puerta principal.',
    };

    it('should accept valid order creation', () => {
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('El pedido debe contener al menos un producto');
      }
    });

    it('should reject single item with zero quantity', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid product in items', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [
          { productId: 'invalid-uuid', quantity: 2 },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject multiple items with total quantity exceeding 100 per product', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 101 },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should accept order with single item', () => {
      const result = createOrderSchema.safeParse({
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440002',
      });
      expect(result.success).toBe(true);
    });

    it('should accept order with multiple different products', () => {
      const result = createOrderSchema.safeParse({
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 },
          { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 3 },
          { productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 1 },
        ],
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440003',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid shippingAddressId format', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        shippingAddressId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Dirección de envío inválida');
      }
    });

    it('should reject missing shippingAddressId', () => {
      const { shippingAddressId, ...dataWithoutAddress } = validOrder;
      const result = createOrderSchema.safeParse(dataWithoutAddress);
      expect(result.success).toBe(false);
    });

    it('should accept order without customer notes (optional)', () => {
      const { customerNotes, ...dataWithoutNotes } = validOrder;
      const result = createOrderSchema.safeParse(dataWithoutNotes);
      expect(result.success).toBe(true);
    });

    it('should accept order with undefined customer notes', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerNotes: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should reject customer notes exceeding 1000 characters', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerNotes: 'A'.repeat(1001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Las notas no pueden exceder 1000 caracteres');
      }
    });

    it('should accept customer notes at exactly 1000 characters', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerNotes: 'A'.repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it('should accept Spanish text in customer notes', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerNotes: 'Por favor, llamar antes de entregar. Número de contacto: +34 600 123 456. ¡Gracias!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing items field', () => {
      const result = createOrderSchema.safeParse({
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440002',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should accept valid status update to CONFIRMED', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.CONFIRMED,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid status update to PREPARING', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.PREPARING,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid status update to SHIPPED', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.SHIPPED,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid status update to DELIVERED', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.DELIVERED,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid status update to CANCELLED', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.CANCELLED,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid status update to PENDING', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.PENDING,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status value', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: 'INVALID_STATUS',
      });
      expect(result.success).toBe(false);
    });

    it('should accept update with only admin notes', () => {
      const result = updateOrderStatusSchema.safeParse({
        adminNotes: 'Pedido verificado y listo para preparación',
      });
      expect(result.success).toBe(true);
    });

    it('should accept update with status and admin notes', () => {
      const result = updateOrderStatusSchema.safeParse({
        status: OrderStatus.PREPARING,
        adminNotes: 'Comenzando impresión de piezas personalizadas',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty update (no changes)', () => {
      const result = updateOrderStatusSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject admin notes exceeding 1000 characters', () => {
      const result = updateOrderStatusSchema.safeParse({
        adminNotes: 'A'.repeat(1001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Las notas no pueden exceder 1000 caracteres');
      }
    });

    it('should accept admin notes at exactly 1000 characters', () => {
      const result = updateOrderStatusSchema.safeParse({
        adminNotes: 'A'.repeat(1000),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('cancelOrderSchema', () => {
    it('should accept valid cancellation with reason', () => {
      const result = cancelOrderSchema.safeParse({
        reason: 'Cliente solicita cancelación por cambio de opinión',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty cancellation reason', () => {
      const result = cancelOrderSchema.safeParse({
        reason: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('El motivo de cancelación es obligatorio');
      }
    });

    it('should reject missing cancellation reason', () => {
      const result = cancelOrderSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding 500 characters', () => {
      const result = cancelOrderSchema.safeParse({
        reason: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('El motivo no puede exceder 500 caracteres');
      }
    });

    it('should accept reason at exactly 500 characters', () => {
      const result = cancelOrderSchema.safeParse({
        reason: 'A'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('should accept Spanish text in cancellation reason', () => {
      const result = cancelOrderSchema.safeParse({
        reason: 'El cliente ha contactado para cancelar. Producto ya no disponible.',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases and business logic', () => {
    it('should handle large orders with maximum quantities', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        productId: `550e8400-e29b-41d4-a716-4466554400${i.toString().padStart(2, '0')}`,
        quantity: 100,
      }));

      const result = createOrderSchema.safeParse({
        items,
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440999',
      });
      expect(result.success).toBe(true);
    });

    it('should validate all items in order, not just first invalid', () => {
      const result = createOrderSchema.safeParse({
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 },
          { productId: 'invalid-uuid', quantity: 1 },
          { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 200 },
        ],
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440002',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle order with unicode characters in notes', () => {
      const result = createOrderSchema.safeParse({
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
        shippingAddressId: '550e8400-e29b-41d4-a716-446655440001',
        customerNotes: '📦 Entregar con cuidado - piezas frágiles',
      });
      expect(result.success).toBe(true);
    });
  });
});
