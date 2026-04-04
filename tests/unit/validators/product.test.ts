/**
 * Product Validators Tests
 * Tests for actual Zod schemas from @/lib/validators
 */
import { describe, it, expect } from 'vitest';
import {
  productSchema,
  productUpdateSchema,
} from '@/lib/validators';
import { Material } from '@/types/prisma-enums';

describe('Product Validators', () => {
  const validProduct = {
    name: 'Florero Decorativo Moderno',
    description: 'Elegante florero impreso en 3D con diseño geométrico contemporáneo. Perfecto para decorar salones, oficinas y espacios modernos. Material PLA de alta calidad.',
    shortDescription: 'Florero 3D moderno',
    price: 24.99,
    previousPrice: null as number | null,
    stock: 15,
    minStock: 5,
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    material: Material.PLA,
    dimensions: '20x15x15 cm',
    weight: 0.25,
    printTime: 180,
    metaTitle: 'Florero Decorativo Moderno | Impresión 3D',
    metaDescription: 'Florero decorativo impreso en 3D con diseño único. Envío gratis en pedidos superiores a 50€.',
    isActive: true,
    isFeatured: false,
  };

  describe('productSchema', () => {
    it('should accept valid product data', () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    describe('name validation', () => {
      it('should reject empty name', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          name: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Product name is required');
        }
      });

      it('should reject name exceeding 200 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          name: 'A'.repeat(201),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name cannot exceed 200 characters');
        }
      });

      it('should accept name with exactly 200 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          name: 'A'.repeat(200),
        });
        expect(result.success).toBe(true);
      });

      it('should accept name with Spanish characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          name: 'Maceta Decorativa con Diseño Único Café',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('description validation', () => {
      it('should reject empty description', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          description: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Description is required');
        }
      });

      it('should reject description exceeding 5000 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          description: 'A'.repeat(5001),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Description cannot exceed 5000 characters');
        }
      });

      it('should accept description with exactly 5000 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          description: 'A'.repeat(5000),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('shortDescription validation', () => {
      it('should accept product without short description (optional)', () => {
        const { shortDescription, ...dataWithoutShort } = validProduct;
        const result = productSchema.safeParse(dataWithoutShort);
        expect(result.success).toBe(true);
      });

      it('should reject short description exceeding 255 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          shortDescription: 'A'.repeat(256),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Short description cannot exceed 255 characters');
        }
      });

      it('should accept short description with exactly 255 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          shortDescription: 'A'.repeat(255),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('price validation', () => {
      it('should reject zero price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 0,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Price must be greater than 0');
        }
      });

      it('should reject negative price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: -10.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Price must be greater than 0');
        }
      });

      it('should accept valid positive price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 0.01,
        });
        expect(result.success).toBe(true);
      });

      it('should reject price exceeding maximum', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 100000,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Maximum price allowed is 99999.99');
        }
      });

      it('should accept price at maximum limit', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 99999.99,
        });
        expect(result.success).toBe(true);
      });

      it('should accept decimal prices', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 29.99,
        });
        expect(result.success).toBe(true);
      });

      it('should reject string price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: '29.99',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('previousPrice validation', () => {
      it('should accept product without previous price', () => {
        const { previousPrice, ...dataWithoutPrev } = validProduct;
        const result = productSchema.safeParse(dataWithoutPrev);
        expect(result.success).toBe(true);
      });

      it('should accept null previous price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          previousPrice: null,
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative previous price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          previousPrice: -5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Previous price cannot be negative');
        }
      });

      it('should accept zero as previous price', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          previousPrice: 0,
        });
        expect(result.success).toBe(true);
      });

      it('should reject previous price exceeding maximum', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          previousPrice: 100000,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Maximum previous price is 99999.99');
        }
      });

      it('should accept valid previous price higher than current', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          price: 19.99,
          previousPrice: 29.99,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('stock validation', () => {
      it('should reject negative stock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          stock: -1,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Stock cannot be negative');
        }
      });

      it('should accept zero stock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          stock: 0,
        });
        expect(result.success).toBe(true);
      });

      it('should accept positive integer stock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          stock: 100,
        });
        expect(result.success).toBe(true);
      });

      it('should reject decimal stock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          stock: 10.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Stock must be an integer');
        }
      });

      it('should accept string number converted to integer', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          stock: 15,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('minStock validation', () => {
      it('should use default value when not provided', () => {
        const { minStock, ...dataWithoutMinStock } = validProduct;
        const result = productSchema.safeParse(dataWithoutMinStock);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.minStock).toBe(5);
        }
      });

      it('should reject minStock less than 1', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          minStock: 0,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Minimum stock must be at least 1');
        }
      });

      it('should reject decimal minStock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          minStock: 3.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Minimum stock must be an integer');
        }
      });

      it('should accept valid minStock', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          minStock: 10,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('categoryId validation', () => {
      it('should accept valid UUID category', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          categoryId: 'not-a-valid-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid category ID');
        }
      });

      it('should accept product without category (optional)', () => {
        const { categoryId, ...dataWithoutCategory } = validProduct;
        const result = productSchema.safeParse(dataWithoutCategory);
        expect(result.success).toBe(true);
      });
    });

    describe('material validation', () => {
      it('should accept valid PLA material', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          material: Material.PLA,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid PETG material', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          material: Material.PETG,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid PETG material', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          material: Material.PETG,
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid material', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          material: 'INVALID_MATERIAL',
        });
        expect(result.success).toBe(false);
      });

      it('should accept product without material (optional)', () => {
        const { material, ...dataWithoutMaterial } = validProduct;
        const result = productSchema.safeParse(dataWithoutMaterial);
        expect(result.success).toBe(true);
      });
    });

    describe('dimensions validation', () => {
      it('should reject dimensions exceeding 50 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          dimensions: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Dimensions cannot exceed 50 characters');
        }
      });

      it('should accept dimensions at 50 character limit', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          dimensions: 'A'.repeat(50),
        });
        expect(result.success).toBe(true);
      });

      it('should accept product without dimensions (optional)', () => {
        const { dimensions, ...dataWithoutDimensions } = validProduct;
        const result = productSchema.safeParse(dataWithoutDimensions);
        expect(result.success).toBe(true);
      });
    });

    describe('weight validation', () => {
      it('should reject negative weight', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          weight: -0.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Weight cannot be negative');
        }
      });

      it('should accept zero weight', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          weight: 0,
        });
        expect(result.success).toBe(true);
      });

      it('should accept null weight', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          weight: null,
        });
        expect(result.success).toBe(true);
      });

      it('should accept product without weight (optional)', () => {
        const { weight, ...dataWithoutWeight } = validProduct;
        const result = productSchema.safeParse(dataWithoutWeight);
        expect(result.success).toBe(true);
      });
    });

    describe('printTime validation', () => {
      it('should reject print time of zero', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          printTime: 0,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Time must be at least 1 minute');
        }
      });

      it('should reject negative print time', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          printTime: -30,
        });
        expect(result.success).toBe(false);
      });

      it('should reject decimal print time', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          printTime: 180.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Time must be an integer');
        }
      });

      it('should accept null print time', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          printTime: null,
        });
        expect(result.success).toBe(true);
      });

      it('should accept product without printTime (optional)', () => {
        const { printTime, ...dataWithoutPrintTime } = validProduct;
        const result = productSchema.safeParse(dataWithoutPrintTime);
        expect(result.success).toBe(true);
      });
    });

    describe('metaTitle validation', () => {
      it('should reject metaTitle exceeding 200 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          metaTitle: 'A'.repeat(201),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Meta title cannot exceed 200 characters');
        }
      });

      it('should accept metaTitle at 200 character limit', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          metaTitle: 'A'.repeat(200),
        });
        expect(result.success).toBe(true);
      });

      it('should accept product without metaTitle (optional)', () => {
        const { metaTitle, ...dataWithoutMetaTitle } = validProduct;
        const result = productSchema.safeParse(dataWithoutMetaTitle);
        expect(result.success).toBe(true);
      });
    });

    describe('metaDescription validation', () => {
      it('should reject metaDescription exceeding 300 characters', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          metaDescription: 'A'.repeat(301),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Meta description cannot exceed 300 characters');
        }
      });

      it('should accept metaDescription at 300 character limit', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          metaDescription: 'A'.repeat(300),
        });
        expect(result.success).toBe(true);
      });

      it('should accept product without metaDescription (optional)', () => {
        const { metaDescription, ...dataWithoutMetaDesc } = validProduct;
        const result = productSchema.safeParse(dataWithoutMetaDesc);
        expect(result.success).toBe(true);
      });
    });

    describe('boolean fields validation', () => {
      it('should use default isActive value', () => {
        const { isActive, ...dataWithoutIsActive } = validProduct;
        const result = productSchema.safeParse(dataWithoutIsActive);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isActive).toBe(true);
        }
      });

      it('should use default isFeatured value', () => {
        const { isFeatured, ...dataWithoutIsFeatured } = validProduct;
        const result = productSchema.safeParse(dataWithoutIsFeatured);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isFeatured).toBe(false);
        }
      });

      it('should accept false isActive', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          isActive: false,
        });
        expect(result.success).toBe(true);
      });

      it('should accept true isFeatured', () => {
        const result = productSchema.safeParse({
          ...validProduct,
          isFeatured: true,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('productUpdateSchema', () => {
    it('should accept partial update with only name', () => {
      const result = productUpdateSchema.safeParse({
        name: 'Nombre Actualizado',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only price', () => {
      const result = productUpdateSchema.safeParse({
        price: 19.99,
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only stock', () => {
      const result = productUpdateSchema.safeParse({
        stock: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid price in partial update', () => {
      const result = productUpdateSchema.safeParse({
        price: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty object (no updates)', () => {
      const result = productUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept multiple field updates', () => {
      const result = productUpdateSchema.safeParse({
        name: 'Nombre Actualizado',
        price: 15.99,
        stock: 20,
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });
});
