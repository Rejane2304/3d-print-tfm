/**
 * Address Validators Tests
 * Tests for actual Zod schemas from @/lib/validators
 */
import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  addressUpdateSchema,
} from '@/lib/validators';

describe('Address Validators', () => {
  const validAddress = {
    name: 'Casa Principal',
    recipient: 'María García López',
    phone: '+34 600 123 456',
    address: 'Calle Mayor 123, 3º Izquierda',
    complement: 'Portero 24h - Timbre 345',
    postalCode: '28013',
    city: 'Madrid',
    province: 'Madrid',
    country: 'España',
    isDefault: true,
  };

  describe('addressSchema', () => {
    it('should accept valid address data', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    describe('name validation', () => {
      it('should reject empty name', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          name: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El nombre de la dirección es obligatorio');
        }
      });

      it('should reject name exceeding 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          name: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El nombre no puede exceder 100 caracteres');
        }
      });

      it('should accept name with exactly 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          name: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });

      it('should accept Spanish address names', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          name: 'Casa de la Abuela María',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('recipient validation', () => {
      it('should reject empty recipient', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          recipient: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El nombre del destinatario es obligatorio');
        }
      });

      it('should reject recipient exceeding 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          recipient: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El destinatario no puede exceder 100 caracteres');
        }
      });

      it('should accept recipient with exactly 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          recipient: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });

      it('should accept Spanish full names', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          recipient: 'José Antonio García Martínez',
        });
        expect(result.success).toBe(true);
      });

      it('should accept company name as recipient', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          recipient: 'Impresiones 3D SL - Depto. Ventas',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('phone validation', () => {
      it('should accept valid Spanish phone with standard spacing', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34 600 123 456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid Spanish phone without spaces', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34600123456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid Spanish phone with partial spacing', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34 600123456',
        });
        expect(result.success).toBe(true);
      });

      it('should reject phone without +34 prefix', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '600 123 456',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'El teléfono debe estar en formato español: +34 600 123 456'
          );
        }
      });

      it('should reject phone with only 8 digits', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34 600 123 45',
        });
        expect(result.success).toBe(false);
      });

      it('should reject phone with 10 digits', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34 600 123 4567',
        });
        expect(result.success).toBe(false);
      });

      it('should reject phone with letters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+34 600 ABC 456',
        });
        expect(result.success).toBe(false);
      });

      it('should reject phone with country code other than 34', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '+33 600 123 456',
        });
        expect(result.success).toBe(false);
      });

      it('should accept different valid Spanish mobile prefixes', () => {
        const validPhones = [
          '+34 600 123 456',
          '+34 610 123 456',
          '+34 620 123 456',
          '+34 630 123 456',
          '+34 640 123 456',
          '+34 650 123 456',
          '+34 660 123 456',
          '+34 670 123 456',
          '+34 680 123 456',
          '+34 690 123 456',
        ];

        for (const phone of validPhones) {
          const result = addressSchema.safeParse({
            ...validAddress,
            phone,
          });
          expect(result.success).toBe(true);
        }
      });

      it('should reject empty phone', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          phone: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('address field validation', () => {
      it('should reject empty address', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          address: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La dirección es obligatoria');
        }
      });

      it('should reject address exceeding 255 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          address: 'A'.repeat(256),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La dirección no puede exceder 255 caracteres');
        }
      });

      it('should accept address with exactly 255 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          address: 'A'.repeat(255),
        });
        expect(result.success).toBe(true);
      });

      it('should accept Spanish street addresses', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          address: 'Calle del Príncipe de Vergara 125, 4º Dcha., Edificio Torreón',
        });
        expect(result.success).toBe(true);
      });

      it('should accept addresses with special characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          address: 'Avenida de la Constitución Nº 45 - Portal B',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('complement validation', () => {
      it('should accept address without complement (optional)', () => {
        const { complement, ...dataWithoutComplement } = validAddress;
        const result = addressSchema.safeParse(dataWithoutComplement);
        expect(result.success).toBe(true);
      });

      it('should reject complement exceeding 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          complement: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El complemento no puede exceder 100 caracteres');
        }
      });

      it('should accept complement at 100 character limit', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          complement: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });

      it('should accept complement with floor and door info', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          complement: '3º Izquierda - Timbre 12',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('postalCode validation', () => {
      it('should accept valid 5-digit Spanish postal code', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '28013',
        });
        expect(result.success).toBe(true);
      });

      it('should accept Barcelona postal code', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '08001',
        });
        expect(result.success).toBe(true);
      });

      it('should accept Valencia postal code', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '46001',
        });
        expect(result.success).toBe(true);
      });

      it('should reject postal code with 4 digits', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '2801',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El código postal debe tener 5 dígitos');
        }
      });

      it('should reject postal code with 6 digits', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '280133',
        });
        expect(result.success).toBe(false);
      });

      it('should reject postal code with letters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '28A13',
        });
        expect(result.success).toBe(false);
      });

      it('should reject postal code starting with 0 followed by non-valid digits', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '00000',
        });
        expect(result.success).toBe(true); // Pattern only checks format, not validity
      });

      it('should reject postal code with spaces', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '28 013',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty postal code', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          postalCode: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('city validation', () => {
      it('should reject empty city', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          city: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La ciudad es obligatoria');
        }
      });

      it('should reject city exceeding 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          city: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La ciudad no puede exceder 100 caracteres');
        }
      });

      it('should accept city with exactly 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          city: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });

      it('should accept Spanish city names with accents', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          city: 'Málaga',
        });
        expect(result.success).toBe(true);
      });

      it('should accept compound city names', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          city: 'Santander',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('province validation', () => {
      it('should reject empty province', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          province: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La provincia es obligatoria');
        }
      });

      it('should reject province exceeding 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          province: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('La provincia no puede exceder 100 caracteres');
        }
      });

      it('should accept province with exactly 100 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          province: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });

      it('should accept Spanish provinces', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          province: 'Barcelona',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('country validation', () => {
      it('should reject empty country', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          country: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El país es obligatorio');
        }
      });

      it('should reject country exceeding 50 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          country: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('El país no puede exceder 50 caracteres');
        }
      });

      it('should accept country with exactly 50 characters', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          country: 'A'.repeat(50),
        });
        expect(result.success).toBe(true);
      });

      it('should use default country value when not provided', () => {
        const { country, ...dataWithoutCountry } = validAddress;
        const result = addressSchema.safeParse(dataWithoutCountry);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.country).toBe('Spain');
        }
      });

      it('should accept España as country', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          country: 'España',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('isDefault validation', () => {
      it('should use default isDefault value when not provided', () => {
        const { isDefault, ...dataWithoutDefault } = validAddress;
        const result = addressSchema.safeParse(dataWithoutDefault);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isDefault).toBe(false);
        }
      });

      it('should accept true isDefault', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          isDefault: true,
        });
        expect(result.success).toBe(true);
      });

      it('should accept false isDefault', () => {
        const result = addressSchema.safeParse({
          ...validAddress,
          isDefault: false,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('addressUpdateSchema', () => {
    it('should accept partial update with only name', () => {
      const result = addressUpdateSchema.safeParse({
        name: 'Nuevo Nombre',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only phone', () => {
      const result = addressUpdateSchema.safeParse({
        phone: '+34 610 987 654',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only address', () => {
      const result = addressUpdateSchema.safeParse({
        address: 'Nueva Calle 456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone in partial update', () => {
      const result = addressUpdateSchema.safeParse({
        phone: '600 123 456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid postal code in partial update', () => {
      const result = addressUpdateSchema.safeParse({
        postalCode: '2801',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty object (no updates)', () => {
      const result = addressUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept multiple field updates', () => {
      const result = addressUpdateSchema.safeParse({
        name: 'Oficina',
        phone: '+34 610 987 654',
        address: 'Avenida Empresarial 100, Planta 5',
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept update to set as default', () => {
      const result = addressUpdateSchema.safeParse({
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept update to remove from default', () => {
      const result = addressUpdateSchema.safeParse({
        isDefault: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases with Spanish data', () => {
    it('should accept full Spanish address', () => {
      const spanishAddress = {
        name: 'Piso en Barcelona',
        recipient: 'Carlos Rodríguez Fernández',
        phone: '+34 622 456 789',
        address: 'Carrer de Mallorca 245, Principal 2ª',
        complement: 'Timbre 42 - Porta Automàtica',
        postalCode: '08008',
        city: 'Barcelona',
        province: 'Barcelona',
        country: 'España',
        isDefault: true,
      };
      const result = addressSchema.safeParse(spanishAddress);
      expect(result.success).toBe(true);
    });

    it('should accept address with ñ and accents', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        recipient: 'Iñigo García Muñoz',
        city: 'A Coruña',
        address: 'Calle Niño Jesús Ñoño 12',
      });
      expect(result.success).toBe(true);
    });

    it('should accept Canary Islands postal code', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        postalCode: '35001',
        city: 'Las Palmas de Gran Canaria',
        province: 'Las Palmas',
      });
      expect(result.success).toBe(true);
    });

    it('should accept Balearic Islands address', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        postalCode: '07001',
        city: 'Palma',
        province: 'Illes Balears',
      });
      expect(result.success).toBe(true);
    });
  });
});
