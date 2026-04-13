/**
 * Integration Tests - Admin Clients API
 * Tests CRUD operations, filtering, and permissions
 * 
 * Estos tests usan la base de datos de prueba (3dprint_tfm_test)
 * y nunca tocan dev ni prod gracias a:
 * 1. Variables de entorno en .env.test
 * 2. Validación en tests/helpers.ts
 * 3. Transacciones con rollback automático
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'node:crypto';

// ============================================
// SETUP DE MOCKS (debe estar antes de importar los routes)
// ============================================
const mockSessions = new Map<string, { email: string; name: string; role: string }>();

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockImplementation(() => {
    // Retorna el último mock configurado
    return Promise.resolve(mockSessions.get('current') || null);
  }),
}));

vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}));

// Ahora importamos los routes (después del mock)
import { GET as getClients } from '@/app/api/admin/clients/route';
import { GET as getClientDetail } from '@/app/api/admin/clients/[id]/route';

describe('Admin Clients API', () => {
  // Helper para configurar mock de sesión
  const setMockSession = (role: string = 'ADMIN', email?: string) => {
    const uniqueEmail = email || `test-${role.toLowerCase()}-${Date.now()}@test.com`;
    const session = {
      user: {
        email: uniqueEmail,
        name: `Test ${role}`,
        role,
      },
    };
    mockSessions.set('current', session.user);
    return session.user;
  };

  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/admin/clients', () => {
    it('should reject unauthenticated requests', async () => {
      mockSessions.clear(); // No session

      const req = new NextRequest('http://localhost:3000/api/admin/clients');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('autenticado');
    });

    it('should reject access for non-admin users', async () => {
      // Crear usuario CUSTOMER en BD de prueba
      const customerEmail = `customer-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: customerEmail,
          name: 'Test Customer',
          password: 'hashed',
          role: 'CUSTOMER',
          updatedAt: new Date(),
        },
      });

      setMockSession('CUSTOMER', customerEmail);

      const req = new NextRequest('http://localhost:3000/api/admin/clients');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('denegado');
    });

    it('should return list of clients for admin', async () => {
      // Crear admin y customer en BD de prueba
      const adminEmail = `admin-${Date.now()}@test.com`;
      const customerEmail = `client-${Date.now()}@test.com`;

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Test Admin',
          password: 'hashed',
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: customerEmail,
          name: 'Test Customer',
          password: 'hashed',
          role: 'CUSTOMER',
          updatedAt: new Date(),
        },
      });

      setMockSession('ADMIN', adminEmail);

      const req = new NextRequest('http://localhost:3000/api/admin/clients');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.clients).toBeDefined();
      expect(Array.isArray(data.clients)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should paginate results correctly', async () => {
      const adminEmail = `admin-pag-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Test Admin',
          password: 'hashed',
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      setMockSession('ADMIN', adminEmail);

      const req = new NextRequest('http://localhost:3000/api/admin/clients?page=1&limit=5');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(5);
      expect(data.clients.length).toBeLessThanOrEqual(5);
    });

    it('should filter by search term', async () => {
      const adminEmail = `admin-search-${Date.now()}@test.com`;
      const searchEmail = `searchable-${Date.now()}@test.com`;

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Test Admin',
          password: 'hashed',
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: searchEmail,
          name: 'Searchable Customer',
          password: 'hashed',
          role: 'CUSTOMER',
          updatedAt: new Date(),
        },
      });

      setMockSession('ADMIN', adminEmail);

      const req = new NextRequest('http://localhost:3000/api/admin/clients?search=Searchable');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.clients.length).toBeGreaterThan(0);
      expect(data.clients[0].name).toContain('Searchable');
    });
  });

  describe('GET /api/admin/clients/[id]', () => {
    it('should return 404 for non-existent client', async () => {
      const adminEmail = `admin-404-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Test Admin',
          password: 'hashed',
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      setMockSession('ADMIN', adminEmail);

      const req = new NextRequest('http://localhost:3000/api/admin/clients/non-existent-id');
      const res = await getClientDetail(req, { params: { id: 'non-existent-id' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return client details', async () => {
      const adminEmail = `admin-detail-${Date.now()}@test.com`;
      const customerId = randomUUID();

      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Test Admin',
          password: 'hashed',
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      await prisma.user.create({
        data: {
          id: customerId,
          email: `customer-detail-${Date.now()}@test.com`,
          name: 'Test Customer Detail',
          password: 'hashed',
          role: 'CUSTOMER',
          updatedAt: new Date(),
        },
      });

      setMockSession('ADMIN', adminEmail);

      const req = new NextRequest(`http://localhost:3000/api/admin/clients/${customerId}`);
      const res = await getClientDetail(req, { params: { id: customerId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.client).toBeDefined();
      expect(data.client.id).toBe(customerId);
      expect(data.client.stats).toBeDefined();
    });
  });
});
