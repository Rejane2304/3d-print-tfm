/**
 * Authentication Validators Tests
 * Tests for actual Zod schemas from @/lib/validators
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '@/lib/validators';

describe('Authentication Validators', () => {
  describe('loginSchema', () => {
    it('should accept valid credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email is required');
      }
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email format');
      }
    });

    it('should reject email without @ symbol', () => {
      const result = loginSchema.safeParse({
        email: 'user.example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email format');
      }
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password is required');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Short1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject password with exactly 7 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Seven77',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should accept password with exactly 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email field', () => {
      const result = loginSchema.safeParse({
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password field', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validRegistration = {
      name: 'María García',
      email: 'maria.garcia@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      phone: '+34 600 123 456',
    };

    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    describe('name validation', () => {
      it('should reject empty name', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          name: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name is required');
        }
      });

      it('should reject name with less than 3 characters', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          name: 'Ma',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at least 3 characters');
        }
      });

      it('should accept name with exactly 3 characters', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          name: 'Ana',
        });
        expect(result.success).toBe(true);
      });

      it('should reject name exceeding 100 characters', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          name: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name cannot exceed 100 characters');
        }
      });

      it('should accept name with exactly 100 characters', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          name: 'A'.repeat(100),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject empty email', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          email: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Email is required');
        }
      });

      it('should reject invalid email format', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          email: 'not-an-email',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid email format');
        }
      });

      it('should accept valid Spanish email with plus sign', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          email: 'usuario+test@gmail.com',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('password validation', () => {
      it('should reject empty password', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: '',
          confirmPassword: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password is required');
        }
      });

      it('should reject password shorter than 8 characters', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'Short1',
          confirmPassword: 'Short1',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
        }
      });

      it('should reject password without uppercase letter', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'password123',
          confirmPassword: 'password123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Password must contain at least one uppercase, one lowercase and one number'
          );
        }
      });

      it('should reject password without lowercase letter', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'PASSWORD123',
          confirmPassword: 'PASSWORD123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Password must contain at least one uppercase, one lowercase and one number'
          );
        }
      });

      it('should reject password without number', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'PasswordABC',
          confirmPassword: 'PasswordABC',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Password must contain at least one uppercase, one lowercase and one number'
          );
        }
      });

      it('should accept password with uppercase, lowercase and number', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'MyP@ssw0rd',
          confirmPassword: 'MyP@ssw0rd',
        });
        expect(result.success).toBe(true);
      });

      it('should reject non-matching passwords', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: 'SecurePass123',
          confirmPassword: 'DifferentPass123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const confirmError = result.error.errors.find(
            (e) => e.path[0] === 'confirmPassword'
          );
          expect(confirmError?.message).toBe('Passwords do not match');
        }
      });

      it('should reject when confirmPassword is empty', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          confirmPassword: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const confirmError = result.error.errors.find(
            (e) => e.path[0] === 'confirmPassword'
          );
          expect(confirmError?.message).toBe('Passwords do not match');
        }
      });
    });

    describe('phone validation', () => {
      it('should accept valid Spanish phone with spaces', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '+34 600 123 456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid Spanish phone without spaces', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '+34600123456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid Spanish phone with mixed spacing', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '+34 600123456',
        });
        expect(result.success).toBe(true);
      });

      it('should reject phone without +34 prefix', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '600 123 456',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Phone must be in Spanish format: +34 600 123 456'
          );
        }
      });

      it('should reject phone with wrong number of digits', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '+34 600 123 45',
        });
        expect(result.success).toBe(false);
      });

      it('should reject phone with too many digits', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: '+34 600 123 4567',
        });
        expect(result.success).toBe(false);
      });

      it('should accept registration without phone (optional field)', () => {
        const { phone, ...dataWithoutPhone } = validRegistration;
        const result = registerSchema.safeParse(dataWithoutPhone);
        expect(result.success).toBe(true);
      });

      it('should accept registration with undefined phone', () => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          phone: undefined,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('changePasswordSchema', () => {
    const validChangePassword = {
      currentPassword: 'OldPass123',
      newPassword: 'NewSecurePass123',
      confirmPassword: 'NewSecurePass123',
    };

    it('should accept valid password change', () => {
      const result = changePasswordSchema.safeParse(validChangePassword);
      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const result = changePasswordSchema.safeParse({
        ...validChangePassword,
        currentPassword: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Current password is required');
      }
    });

    it('should reject new password without required complexity', () => {
      const result = changePasswordSchema.safeParse({
        ...validChangePassword,
        newPassword: 'simple',
        confirmPassword: 'simple',
      });
      expect(result.success).toBe(false);
    });

    it('should reject when new passwords do not match', () => {
      const result = changePasswordSchema.safeParse({
        ...validChangePassword,
        confirmPassword: 'DifferentPass123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find(
          (e) => e.path[0] === 'confirmPassword'
        );
        expect(confirmError?.message).toBe('Passwords do not match');
      }
    });

    it('should reject new password shorter than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        ...validChangePassword,
        newPassword: 'Short1',
        confirmPassword: 'Short1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('New password must be at least 8 characters');
      }
    });
  });
});
