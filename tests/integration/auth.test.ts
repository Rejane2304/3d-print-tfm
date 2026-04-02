import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

// Mock de next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));
import { getToken } from 'next-auth/jwt';

describe('Autenticación y Autorización', () => {
  const mockGetToken = vi.mocked(getToken);
  
  const usuarioTest = {
    email: `auth-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    nombre: 'Usuario Test',
  };

  beforeEach(async () => {
    mockGetToken.mockReset();
    mockGetToken.mockResolvedValue(null);
    
    // Limpiar y crear usuario de test
    await prisma.usuario.deleteMany({ where: { email: usuarioTest.email } });
    
    const hashedPassword = await bcrypt.hash(usuarioTest.password, 12);
    await prisma.usuario.create({
      data: {
        email: usuarioTest.email,
        password: hashedPassword,
        nombre: usuarioTest.nombre,
        rol: 'CLIENTE',
        activo: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: usuarioTest.email } });
  });

  describe('Login y Verificación de Credenciales', () => {
    it('debe autorizar con credenciales válidas', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.email).toBe(usuarioTest.email);
      expect(usuario!.activo).toBe(true);

      const passwordValido = await bcrypt.compare(usuarioTest.password, usuario!.password);
      expect(passwordValido).toBe(true);
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
      });

      const passwordValido = await bcrypt.compare('wrong-password', usuario!.password);
      expect(passwordValido).toBe(false);
    });

    it('debe rechazar usuario inexistente', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(usuario).toBeNull();
    });
  });

  describe('Middleware - Rutas de Admin', () => {
    it('debe redirigir a /auth usuarios no autenticados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/admin/dashboard');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toContain('/auth');
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

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Middleware - Rutas de Cliente', () => {
    it('debe permitir acceso a /cart para invitados', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });

    it('debe redirigir a /auth para /checkout si no autenticado', async () => {
      mockGetToken.mockResolvedValue(null);

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toContain('/auth');
    });

    it('debe permitir acceso a /checkout para CLIENTE autenticado', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/checkout');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Middleware - Redirecciones de Rol', () => {
    it('debe redirigir ADMIN en /cart a /admin/dashboard', async () => {
      mockGetToken.mockResolvedValue({
        email: 'admin@3dprint.com',
        rol: 'ADMIN',
      });

      const req = createRequest('/cart');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/dashboard');
    });

    it('debe redirigir CLIENTE en /admin a /', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
      });

      const req = createRequest('/admin/orders');
      const middleware = await import('@/middleware');
      const res = await middleware.middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('debe redirigir autenticados en /auth a home según rol', async () => {
      mockGetToken.mockResolvedValue({
        email: 'cliente@example.com',
        rol: 'CLIENTE',
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
