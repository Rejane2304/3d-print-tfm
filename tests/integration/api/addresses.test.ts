/**
 * Integration Tests - Addresses API
 * Testing real database and API endpoints
 * 
 * Endpoints:
 * - GET /api/account/addresses - list addresses
 * - POST /api/account/addresses - create address
 * - PATCH /api/account/addresses - update address
 * - DELETE /api/account/addresses?id=xxx - delete address
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/account/addresses/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Addresses API', () => {
  let customerUser: { id: string; email: string; name: string };

  beforeEach(async () => {
    // Clean up
    await prisma.address.deleteMany({
      where: { user: { email: { startsWith: 'address-test-' } } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'address-test-' } } },
    );

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    customerUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `address-test-${Date.now()}@test.com`,
        password: hashedPassword,
        name: 'Address Test User',
        role: 'CUSTOMER',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Reset mocks
    vi.mocked(getServerSession).mockReset();
  });

  afterEach(async () => {
    // Clean up
    await prisma.address.deleteMany({
      where: { user: { email: { startsWith: 'address-test-' } } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'address-test-' } } },
    );
  });

  describe('GET /api/account/addresses', () => {
    it('should return 401 without authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const res = await GET();

      expect(res.status).toBe(401);
    });

    it('should return empty list for new user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.addresses).toEqual([]);
    });

    it('should return user addresses', async () => {
      // Create addresses
      await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Principal 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
          country: 'Spain',
          isDefault: true,
          updatedAt: new Date(),
        },
      });

      await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Work',
          recipient: 'Test User Work',
          phone: '+34 600 789 012',
          address: 'Avenida Trabajo 456',
          city: 'Barcelona',
          province: 'Barcelona',
          postalCode: '08001',
          country: 'Spain',
          isDefault: false,
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.addresses.length).toBe(2);
      // Default address should be first
      expect(body.addresses[0].isDefault).toBe(true);
      expect(body.addresses[0].name).toBe('Home');
    });
  });

  describe('POST /api/account/addresses', () => {
    it('should create new address', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mi Casa',
          recipient: 'John Doe',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
          isDefault: true,
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.address).toBeDefined();
      expect(body.address.name).toBe('Mi Casa');
      expect(body.address.recipient).toBe('John Doe');
      expect(body.address.city).toBe('Madrid');
      expect(body.address.isDefault).toBe(true);
    });

    it('should validate required fields', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          recipient: '',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should validate postal code format', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '123', // Invalid: should be 5 digits
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should set first address as default', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
          isDefault: false, // Trying to set as non-default
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      // First address should be default regardless
      expect(body.address.isDefault).toBe(true);
    });
  });

  describe('PATCH /api/account/addresses', () => {
    let testAddress: { id: string };

    beforeEach(async () => {
      testAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
          country: 'Spain',
          isDefault: true,
          updatedAt: new Date(),
        },
      });
    });

    it('should update address', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: testAddress.id,
          name: 'Updated Home',
          recipient: 'Updated User',
        }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.address.name).toBe('Updated Home');
      expect(body.address.recipient).toBe('Updated User');
    });

    it('should require address ID', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('should not allow updating another user address', async () => {
      // Create another user with address
      const otherUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `address-test-other-${Date.now()}@test.com`,
          password: await bcrypt.hash('Pass123!', 10),
          name: 'Other User',
          role: 'CUSTOMER',
          isActive: true,
          updatedAt: new Date(),
        },
      });

      const otherAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: otherUser.id,
          name: 'Other Home',
          recipient: 'Other User',
          phone: '+34 600 999 999',
          address: 'Otra Calle 999',
          city: 'Valencia',
          province: 'Valencia',
          postalCode: '46001',
          country: 'Spain',
          isDefault: true,
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: otherAddress.id,
          name: 'Hacked!',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(404);

      await prisma.address.delete({ where: { id: otherAddress.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should unset other addresses when marking new default', async () => {
      // Create second address
      const secondAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Work',
          recipient: 'Work User',
          phone: '+34 600 222 222',
          address: 'Work Address 456',
          city: 'Barcelona',
          province: 'Barcelona',
          postalCode: '08001',
          country: 'Spain',
          isDefault: false,
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      // Mark work as default
      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: secondAddress.id,
          isDefault: true,
        }),
      });

      await PATCH(req);

      // Verify home is no longer default
      const homeAddress = await prisma.address.findUnique({
        where: { id: testAddress.id },
      });
      expect(homeAddress!.isDefault).toBe(false);

      // Verify work is now default
      const workAddress = await prisma.address.findUnique({
        where: { id: secondAddress.id },
      });
      expect(workAddress!.isDefault).toBe(true);
    });
  });

  describe('DELETE /api/account/addresses', () => {
    let testAddress: { id: string };

    beforeEach(async () => {
      testAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Home',
          recipient: 'Test User',
          phone: '+34 600 123 456',
          address: 'Calle Test 123',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28001',
          country: 'Spain',
          isDefault: true,
          updatedAt: new Date(),
        },
      });
    });

    it('should delete address', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/account/addresses?id=${testAddress.id}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify address is deleted
      const deleted = await prisma.address.findUnique({
        where: { id: testAddress.id },
      });
      expect(deleted).toBeNull();
    });

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/account/addresses?id=${testAddress.id}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(401);
    });

    it('should not allow deleting another user address', async () => {
      // Create another user with address
      const otherUser = await prisma.user.create({
        data: {
          id: randomUUID(),
        email: `address-test-other-${Date.now()}@test.com`,
          password: await bcrypt.hash('Pass123!', 10),
          name: 'Other User',
          role: 'CUSTOMER',
          isActive: true,
          updatedAt: new Date(),
        },
      });

      const otherAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: otherUser.id,
          name: 'Other Home',
          recipient: 'Other User',
          phone: '+34 600 999 999',
          address: 'Otra Calle 999',
          city: 'Valencia',
          province: 'Valencia',
          postalCode: '46001',
          country: 'Spain',
          isDefault: true,
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/account/addresses?id=${otherAddress.id}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(404);

      await prisma.address.delete({ where: { id: otherAddress.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should promote another address to default when deleting default', async () => {
      // Create second address
      const secondAddress = await prisma.address.create({
        data: {
          id: randomUUID(),
          userId: customerUser.id,
          name: 'Work',
          recipient: 'Work User',
          phone: '+34 600 222 222',
          address: 'Work Address 456',
          city: 'Barcelona',
          province: 'Barcelona',
          postalCode: '08001',
          country: 'Spain',
          isDefault: false,
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      // Delete default address
      const req = new NextRequest(`http://localhost:3000/api/account/addresses?id=${testAddress.id}`, {
        method: 'DELETE',
      });

      await DELETE(req);

      // Verify work is now default
      const workAddress = await prisma.address.findUnique({
        where: { id: secondAddress.id },
      });
      expect(workAddress!.isDefault).toBe(true);
    });

    it('should require address ID', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/account/addresses', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });
  });
});
