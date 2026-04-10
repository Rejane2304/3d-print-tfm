/**
 * Tests for Admin Clients API
 * Tests CRUD operations, filtering, and permissions
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getClients } from '@/app/api/admin/clients/route';
import { GET as getClientDetail } from '@/app/api/admin/clients/[id]/route';
import { withTestTransaction } from '../../helpers';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

const mockGetServerSession = getServerSession as Mock;

describe('Admin Clients API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockSession = (role: string = 'ADMIN') => ({
    user: {
      email: `test-${role.toLowerCase()}@test.com`,
      name: `Test ${role}`,
      role,
    },
  });

  describe('GET /api/admin/clients', () => {
    it('should return list of clients for admin', async () => {
      await withTestTransaction(async () => {
        // Create admin user
        const admin = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'admin.test@example.com',
            name: 'Admin Test',
            password: 'password',
            role: 'ADMIN',
            updatedAt: new Date(),
          },
        });

        // Create customer
        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'customer.test@example.com',
            name: 'Customer Test',
            password: 'password',
            role: 'CUSTOMER',
            updatedAt: new Date(),
          },
        });

        mockGetServerSession.mockResolvedValue(createMockSession('ADMIN'));

        const req = new NextRequest('http://localhost:3000/api/admin/clients');
        const res = await getClients(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.clients).toBeDefined();
        expect(Array.isArray(data.clients)).toBe(true);
        expect(data.pagination).toBeDefined();
      });
    });

    it('should reject access for non-admin users', async () => {
      await withTestTransaction(async () => {
        // Create customer user
        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'customer2.test@example.com',
            name: 'Customer2 Test',
            password: 'password',
            role: 'CUSTOMER',
            updatedAt: new Date(),
          },
        });

        mockGetServerSession.mockResolvedValue(createMockSession('CUSTOMER'));

        const req = new NextRequest('http://localhost:3000/api/admin/clients');
        const res = await getClients(req);
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('denegado');
      });
    });

    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/clients');
      const res = await getClients(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('autenticado');
    });

    it('should filter by search term', async () => {
      await withTestTransaction(async () => {
        // Create customers
        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'searchable@example.com',
            name: 'Searchable Customer',
            password: 'password',
            role: 'CUSTOMER',
            updatedAt: new Date(),
          },
        });

        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'other@example.com',
            name: 'Other Customer',
            password: 'password',
            role: 'CUSTOMER',
            updatedAt: new Date(),
          },
        });

        mockGetServerSession.mockResolvedValue(createMockSession('ADMIN'));

        const req = new NextRequest('http://localhost:3000/api/admin/clients?search=Searchable');
        const res = await getClients(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.clients.length).toBeGreaterThan(0);
        expect(data.clients[0].name).toContain('Searchable');
      });
    });

    it('should paginate results correctly', async () => {
      await withTestTransaction(async () => {
        // Create multiple customers
        for (let i = 1; i <= 10; i++) {
          await prisma.user.create({
            data: {
              id: randomUUID(),
              email: `customer${i}@example.com`,
              name: `Customer ${i}`,
              password: 'password',
              role: 'CUSTOMER',
              updatedAt: new Date(),
            },
          });
        }

        mockGetServerSession.mockResolvedValue(createMockSession('ADMIN'));

        const req = new NextRequest('http://localhost:3000/api/admin/clients?page=1&limit=5');
        const res = await getClients(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(5);
        expect(data.clients.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('GET /api/admin/clients/[id]', () => {
    it('should return client details', async () => {
      await withTestTransaction(async () => {
        // Create admin and customer
        const admin = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'admin2@example.com',
            name: 'Admin2',
            password: 'password',
            role: 'ADMIN',
            updatedAt: new Date(),
          },
        });

        const customer = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'customer3@example.com',
            name: 'Customer3',
            password: 'password',
            role: 'CUSTOMER',
            updatedAt: new Date(),
          },
        });

        mockGetServerSession.mockResolvedValue(createMockSession('ADMIN'));

        const req = new NextRequest(`http://localhost:3000/api/admin/clients/${customer.id}`);
        const res = await getClientDetail(req, { params: { id: customer.id } });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.client).toBeDefined();
        expect(data.client.id).toBe(customer.id);
        expect(data.client.stats).toBeDefined();
      });
    });

    it('should return 404 for non-existent client', async () => {
      await withTestTransaction(async () => {
        // Create admin
        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'admin3@example.com',
            name: 'Admin3',
            password: 'password',
            role: 'ADMIN',
            updatedAt: new Date(),
          },
        });

        mockGetServerSession.mockResolvedValue(createMockSession('ADMIN'));

        const req = new NextRequest('http://localhost:3000/api/admin/clients/non-existent-id');
        const res = await getClientDetail(req, { params: { id: 'non-existent-id' } });
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.success).toBe(false);
      });
    });
  });
});
