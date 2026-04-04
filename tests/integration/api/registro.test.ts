/**
 * Integration Tests - Register API
 * POST /api/auth/register
 * 
 * NOTE: Validation tests (email, password, phone)
 * are in tests/unit/validaciones.test.ts
 * This file tests integration behavior with database.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/auth/register/route';
import { prisma } from '../../helpers';

describe('POST /api/auth/register', () => {
  let validData: any;

  beforeEach(async () => {
    // Generate unique email with timestamp
    validData = {
      name: 'John Smith',
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: '+34 600 123 456',
    };
  });

  describe('Successful registration', () => {
    it('should create user with valid data', async () => {
      const req = createRequest(validData);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(validData.email.toLowerCase());
      expect(body.user.password).toBeUndefined();
    });

    it('should store email in lowercase', async () => {
      const emailUpper = `TEST-${Date.now()}@EXAMPLE.COM`;
      const req = createRequest({ ...validData, email: emailUpper });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.user.email).toBe(emailUpper.toLowerCase());
    });

    it('should hash the password', async () => {
      const req = createRequest(validData);
      await POST(req);

      const user = await prisma.user.findUnique({
        where: { email: validData.email.toLowerCase() },
      });

      expect(user).toBeDefined();
      expect(user!.password).not.toBe(validData.password);
      expect(user!.password).toMatch(/^\$2[aby]\$/);
    });

    it('should assign CUSTOMER role by default', async () => {
      const req = createRequest(validData);
      await POST(req);

      const user = await prisma.user.findUnique({
        where: { email: validData.email.toLowerCase() },
      });

      expect(user!.role).toBe('CUSTOMER');
    });

    it('should activate user by default', async () => {
      const req = createRequest(validData);
      await POST(req);

      const user = await prisma.user.findUnique({
        where: { email: validData.email.toLowerCase() },
      });

      expect(user!.isActive).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should reject duplicate email', async () => {
      // Create user first
      const req1 = createRequest(validData);
      const res1 = await POST(req1);
      expect(res1.status).toBe(201);

      // Attempt to create duplicate
      const req2 = createRequest({
        ...validData,
        name: 'Another Name',
      });
      const res2 = await POST(req2);
      const body2 = await res2.json();

      expect(res2.status).toBe(409);
      expect(body2.success).toBe(false);
      expect(body2.error).toContain('Already exists');
    }, 15000);

    // Validation tests (invalid email, weak password, etc.)
    // are in tests/unit/validaciones.test.ts
    // Here we only test database and API behavior
  });
});

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}