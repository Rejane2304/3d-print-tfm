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
    it('debe redirigir a /login usuarios no autenticados', async () => {
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

  describe('Rutas de Cliente (/carrito, /checkout, /cuenta)', () => {
    it('debe redirigir a /login con callback URL usuarios no autenticados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/carrito');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('callbackUrl');
      expect(location).toContain(encodeURIComponent('/carrito'));
    });

    it('debe permitir acceso a CLIENTE autenticados', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/carrito');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe redirigir ADMIN a /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/carrito');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
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

      const req = createRequest('/cuenta/pedidos');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });
  });

  describe('Rutas de Autenticación (/login, /registro)', () => {
    it('debe redirigir CLIENTE autenticados a /', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/login');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('debe redirigir ADMIN autenticados a /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/login');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('debe permitir acceso a usuarios no autenticados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/login');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe aplicar a /registro también', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/registro');
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

    it('debe permitir acceso a /productos sin autenticación', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/productos');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe permitir acceso a ADMIN a /productos', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/productos');
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
