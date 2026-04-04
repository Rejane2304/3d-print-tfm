import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));
import { getToken } from 'next-auth/jwt';

describe('Authentication and Authorization', () => {
  const mockGetToken = vi.mocked(getToken);
  
  const testUser = {
    email: `auth-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    mockGetToken.mockReset();
    mockGetToken.mockResolvedValue(null);
    
    // Clean and create test user
    await prisma.usuario.deleteMany({ where: { email: testUser.email } });
    
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    await prisma.usuario.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        role: 'CUSTOMER',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: testUser.email } });
  });

  describe('Login and Credential Verification', () => {
    it('should authorize with valid credentials', async () => {
      const user = await prisma.usuario.findUnique({
        where: { email: testUser.email },
      });

      expect(user).toBeDefined();
      expect(user!.email).toBe(testUser.email);
      expect(user!.isActive).toBe(true);

      const isValidPassword = await bcrypt.compare(testUser.password, user!.password);
      expect(isValidPassword).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await prisma.usuario.findUnique({
        where: { email: testUser.email },
      });

      const isValidPassword = await bcrypt.compare('wrong-password', user!.password);
      expect(isValidPassword).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const user = await prisma.usuario.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });
  });

  describe('Middleware - Admin Routes', () => {
    it('should redirect to /auth unauthenticated users', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toContain('/auth');
    });

    it('should redirect CUSTOMER users attempting to access admin', async () => {
      mockGetToken.mockResolvedValue({
        email: 'customer@example.com',
        role: 'CUSTOMER',
      });

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should allow access to authenticated ADMIN', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        role: 'ADMIN',
      });

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Middleware - Customer Routes', () => {
    it('should allow access to /cart for guests', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('should redirect to /auth for /checkout if not authenticated', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toContain('/auth');
    });

    it('should allow access to /checkout for authenticated CUSTOMER', async () => {
      mockGetToken.mockResolvedValue({
        email: 'customer@example.com',
        role: 'CUSTOMER',
      });

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Middleware - Role Redirects', () => {
    it('should redirect ADMIN from /cart to /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        role: 'ADMIN',
      });

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('should redirect CUSTOMER from /admin to /', async () => {
      mockGetToken.mockResolvedValue({
        email: 'customer@example.com',
        role: 'CUSTOMER',
      });

      const req = createRequest('/admin/orders');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should redirect authenticated users from /auth to home based on role', async () => {
      mockGetToken.mockResolvedValue({
        email: 'customer@example.com',
        role: 'CUSTOMER',
      });

      const req = createRequest('/auth');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });
  });
});

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    headers: new Headers({
      'host': 'localhost:3000',
    }),
  });
}
