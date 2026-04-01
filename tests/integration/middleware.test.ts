/**
 * Tests de Integración - Middleware de Autorización
 * Tests para las reglas de redirección y protección de rutas
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock de next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';

describe('Middleware de Autorización', () => {
  const mockGetToken = vi.mocked(getToken);

  beforeEach(() => {
    mockGetToken.mockReset();
    // Por defecto, usuario no autenticado
    mockGetToken.mockResolvedValue(null);
  });

  describe('Rutas de Admin (/admin/*)', () => {
    it('debe redirigir a /auth usuarios no autenticados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res).toBeInstanceOf(NextResponse);
      const location = res.headers.get('location');
      expect(location).toContain('/login');
    });

    it('debe redirigir a / clientes que intentan acceder', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('debe permitir acceso a ADMIN autenticados', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      // Si es next(), no hay redirección (location no está definido)
      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Rutas de Cliente (/checkout, /account) - /cart ya NO requiere auth', () => {
    it('debe PERMITIR acceso a /cart para usuarios no autenticados (usar localStorage)', async () => {
      // CAMBIO: /cart ahora es accesible para invitados
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      // No debe redirigir, el carrito es accesible para todos
      expect(res.headers.get('location')).toBeNull();
    });

    it('debe PERMITIR acceso a /cart para CLIENTE autenticados', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe redirigir ADMIN que intenta acceder a /cart a /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('debe redirigir a /login con callback URL usuarios no autenticados en /checkout', async () => {
      // /checkout SÍ requiere autenticación
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('callbackUrl');
      expect(location).toContain(encodeURIComponent('/checkout'));
    });

    it('debe redirigir a /login con callback URL usuarios no autenticados en /account', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/account');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('callbackUrl');
      expect(location).toContain(encodeURIComponent('/account'));
    });

    it('debe redirigir ADMIN intentando checkout', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('debe redirigir ADMIN intentando acceder a cuenta', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/account/orders');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });
  });

  describe('Rutas de Autenticación (/auth)', () => {
    it('debe redirigir CLIENTE autenticados a /', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/auth');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('debe redirigir ADMIN autenticados a /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/auth');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('debe permitir acceso a usuarios no autenticados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/auth');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe aplicar a /auth con tab=register también', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/auth?tab=register');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Rutas públicas', () => {
    it('debe permitir acceso a / sin autenticación', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe permitir acceso a /products sin autenticación', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/products');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe permitir acceso a ADMIN a /productos', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/products');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      // Admin puede ver productos (catálogo público)
      expect(res.headers.get('location')).toBeNull();
    });
  });
});

// Helper para crear requests
function createRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: 'GET',
  });
}
