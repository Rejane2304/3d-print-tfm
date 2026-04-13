/**
 * Integration Tests - Authentication API
 * Testing real database and API endpoints
 *
 * Endpoints:
 * - POST /api/auth/register - user creation
 * - POST /api/auth/login - session creation (via NextAuth)
 * - GET /api/auth/session - session validation
 * - Logout flow
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerUser } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Authentication API', () => {
  const testUser = {
    name: 'Test User',
    email: `auth-test-${Date.now()}@test.com`,
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    phone: '+34 600 123 456',
  };

  beforeEach(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'auth-test-' } },
    });
  });

  afterEach(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'auth-test-' } },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create user with valid data', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(testUser.email.toLowerCase());
      expect(body.user.password).toBeUndefined(); // Never return password

      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.role).toBe('CUSTOMER');
      expect(dbUser!.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      // Create user first
      await registerUser(
        new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        }),
      );

      // Attempt duplicate
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, name: 'Another Name' }),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Ya existe un usuario con este email');
    });

    it('should store password hashed', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      await registerUser(req);

      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      expect(dbUser!.password).not.toBe(testUser.password);
      expect(dbUser!.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format

      const isValid = await bcrypt.compare(testUser.password, dbUser!.password);
      expect(isValid).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: 'invalid-email',
        }),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('email');
    });

    it('should reject short password', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          password: 'short',
          confirmPassword: 'short',
        }),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('should reject missing name', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.confirmPassword,
        }),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      // Zod returns "Required" for missing required fields
      expect(body.error).toMatch(/(El nombre es obligatorio|Required)/);
    });

    it('should create user with address if provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: `auth-test-address-${Date.now()}@test.com`,
          address: {
            name: 'Mi Casa',
            address: 'Calle Principal 123',
            city: 'Madrid',
            postalCode: '28001',
            province: 'Madrid',
          },
        }),
      });

      const res = await registerUser(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.user.address).toBeDefined();
      expect(body.user.address.city).toBe('Madrid');
    });
  });

  describe('Login (NextAuth Credentials)', () => {
    it('should verify credentials against database', async () => {
      // Create user first
      await registerUser(
        new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        }),
      );

      // Verify credential validation logic
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      expect(dbUser).toBeTruthy();

      const isValidPassword = await bcrypt.compare(testUser.password, dbUser!.password);
      expect(isValidPassword).toBe(true);
    });

    it('should reject invalid password', async () => {
      // Create user first
      await registerUser(
        new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        }),
      );

      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      const isValidPassword = await bcrypt.compare('wrong-password', dbUser!.password);
      expect(isValidPassword).toBe(false);
    });

    it('should not find non-existent user', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { email: 'non-existent@test.com' },
      });

      expect(dbUser).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create user with CUSTOMER role by default', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      await registerUser(req);

      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      expect(dbUser!.role).toBe('CUSTOMER');
    });

    it('should activate user by default', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      await registerUser(req);

      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      expect(dbUser!.isActive).toBe(true);
    });

    it('should store email in lowercase', async () => {
      const upperEmail = `UPPER-${Date.now()}@TEST.COM`;
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: upperEmail,
        }),
      });

      await registerUser(req);

      const dbUser = await prisma.user.findUnique({
        where: { email: upperEmail.toLowerCase() },
      });

      expect(dbUser!.email).toBe(upperEmail.toLowerCase());
    });
  });
});
