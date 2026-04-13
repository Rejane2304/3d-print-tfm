/**
 * Integration Tests - Invoice API
 * Testing real database and API endpoints
 * 
 * Endpoints:
 * - POST /api/admin/invoices - create invoice
 * - GET /api/admin/invoices/[id]/pdf - generate PDF
 * - Invoice state management
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listInvoices, POST as createInvoice } from '@/app/api/admin/invoices/route';
import { GET as generateInvoicePDF } from '@/app/api/admin/invoices/[id]/pdf/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Invoices API', () => {
  let adminUser: { id: string; email: string; name: string };
  let customerUser: { id: string; email: string; name: string };
  let testOrder: { id: string; orderNumber: string; status: string };

  beforeEach(async () => {
    // Clean up
    await prisma.invoice.deleteMany({
      where: { order: { user: { email: { startsWith: 'invoice-test-' } } } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { startsWith: 'invoice-test-' } } } },
    });
    await prisma.order.deleteMany({
      where: { user: { email: { startsWith: 'invoice-test-' } } },
    });
    await prisma.address.deleteMany({
      where: { user: { email: { startsWith: 'invoice-test-' } } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'invoice-test-' } } },
    );

    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPass123!', 10);
    adminUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `invoice-test-admin-${Date.now()}@test.com`,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create customer user
    const customerPassword = await bcrypt.hash('CustomerPass123!', 10);
    customerUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `invoice-test-customer-${Date.now()}@test.com`,
        password: customerPassword,
        name: 'Customer User',
        role: 'CUSTOMER',
        isActive: true,
        taxId: '12345678A',
        updatedAt: new Date(),
      },
    });

    // Create delivered order
    const timestamp = Date.now().toString().slice(-6);
    testOrder = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: `P-2024-${timestamp}`,
        userId: customerUser.id,
        status: 'DELIVERED',
        subtotal: 29.99,
        shipping: 5.99,
        total: 35.98,
        shippingName: 'Customer User',
        shippingPhone: '+34 600 123 456',
        shippingAddress: 'Calle Test 123',
        shippingPostalCode: '28001',
        shippingCity: 'Madrid',
        shippingProvince: 'Madrid',
        shippingCountry: 'Spain',
        updatedAt: new Date(),
        items: {
          create: [
            {
              id: randomUUID(),
              name: 'Test Product',
              price: 29.99,
              quantity: 1,
              subtotal: 29.99,
              category: 'Test Category',
              material: 'PLA',
            },
          ],
        },
      },
    });

    // Reset mocks
    vi.mocked(getServerSession).mockReset();
  });

  afterEach(async () => {
    // Clean up
    await prisma.invoice.deleteMany({
      where: { order: { user: { email: { startsWith: 'invoice-test-' } } } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { startsWith: 'invoice-test-' } } } },
    });
    await prisma.order.deleteMany({
      where: { user: { email: { startsWith: 'invoice-test-' } } },
    });
    await prisma.address.deleteMany({
      where: { user: { email: { startsWith: 'invoice-test-' } } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'invoice-test-' } } },
    );
  });

  describe('POST /api/admin/invoices', () => {
    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
      });

      const res = await createInvoice(req);
      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
      });

      const res = await createInvoice(req);
      expect(res.status).toBe(403);
    });

    it('should require orderId', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await createInvoice(req);
      expect(res.status).toBe(400);
    });

    it('should reject non-existent order', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: '00000000-0000-0000-0000-000000000000' }),
      });

      const res = await createInvoice(req);
      expect(res.status).toBe(404);
    });

    it('should create invoice for delivered order', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.factura).toBeDefined();
      expect(body.factura.invoiceNumber).toMatch(/^F-\d{4}-\d{6}$/);
      expect(body.factura.orderId).toBe(testOrder.id);
      
      // Verify VAT calculation (21% on products only, not shipping)
      const subtotal = Number(body.factura.subtotal);
      const vatAmount = Number(body.factura.vatAmount);
      const expectedVat = (subtotal * 21) / 100;
      expect(vatAmount).toBeCloseTo(expectedVat, 2);
    });

    it('should reject duplicate invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      // Create a fresh order for this test to avoid cleanup issues
      const freshOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: `P-2024-${Date.now().toString().slice(-6)}`,
          userId: customerUser.id,
          status: 'DELIVERED',
          subtotal: 29.99,
          shipping: 5.99,
          total: 35.98,
          shippingName: 'Customer User',
          shippingPhone: '+34 600 123 456',
          shippingAddress: 'Calle Test 123',
          shippingPostalCode: '28001',
          shippingCity: 'Madrid',
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          updatedAt: new Date(),
        },
      });

      // Create first invoice
      await createInvoice(new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: freshOrder.id }),
      }));

      // Try to create duplicate
      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: freshOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Ya existe');
    });

    it('should reject invoice for non-delivered order', async () => {
      // Create pending order
      const pendingOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: `P-PEND-${Date.now().toString().slice(-8)}`,
          userId: customerUser.id,
          status: 'PENDING',
          subtotal: 29.99,
          shipping: 5.99,
          total: 35.98,
          shippingName: 'Customer User',
          shippingPhone: '+34 600 123 456',
          shippingAddress: 'Calle Test 123',
          shippingPostalCode: '28001',
          shippingCity: 'Madrid',
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          updatedAt: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pendingOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('entregado');
    });

    it('should include company data in invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(body.factura.companyName).toBe('3D Print');
      expect(body.factura.companyTaxId).toBe('B12345678');
      expect(body.factura.clientTaxId).toBe('12345678A');
    });
  });

  describe('GET /api/admin/invoices', () => {
    beforeEach(async () => {
      // Create an invoice
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      await createInvoice(new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
      }));
    });

    it('should list invoices', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices');
      const res = await listInvoices(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.facturas).toBeDefined();
      expect(body.facturas.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/invoices');
      const res = await listInvoices(req);
      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices');
      const res = await listInvoices(req);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/invoices/[id]/pdf', () => {
    let invoiceId: string;
    let pdfTestOrder: { id: string; orderNumber: string };

    beforeEach(async () => {
      // Create fresh order for PDF tests
      pdfTestOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: `P-PDF-${Date.now().toString().slice(-8)}`,
          userId: customerUser.id,
          status: 'DELIVERED',
          subtotal: 50,
          shipping: 0,
          total: 60.50,
          shippingName: 'Test User',
          shippingPhone: '+34 600 123 456',
          shippingAddress: 'Calle Test 123',
          shippingPostalCode: '28001',
          shippingCity: 'Madrid',
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          updatedAt: new Date(),
          items: {
            create: [{
              id: randomUUID(),
              name: 'Test Product',
              price: 50,
              quantity: 1,
              subtotal: 50,
              category: 'Test',
              material: 'PLA',
            }],
          },
        },
      });

      // Create an invoice
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const res = await createInvoice(new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pdfTestOrder.id }),
      }));
      const body = await res.json();
      invoiceId = body.factura.id;
    });

    it('should generate PDF for invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}/pdf`);
      const res = await generateInvoicePDF(req, { params: { id: invoiceId } });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('attachment');
    });

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}/pdf`);
      const res = await generateInvoicePDF(req, { params: { id: invoiceId } });
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices/non-existent-id/pdf');
      const res = await generateInvoicePDF(req, { params: { id: 'non-existent-id' } });
      expect(res.status).toBe(404);
    });
  });

  describe('Invoice State Management', () => {
    it('should track invoice totals correctly', async () => {
      // Create fresh order for this test
      const freshOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: `P-2024-${Date.now().toString().slice(-6)}`,
          userId: customerUser.id,
          status: 'DELIVERED',
          subtotal: 100,
          shipping: 5,
          total: 126, // 100 * 1.21 + 5 = 126
          shippingName: 'Test User',
          shippingPhone: '+34 600 123 456',
          shippingAddress: 'Calle Test 123',
          shippingPostalCode: '28001',
          shippingCity: 'Madrid',
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          updatedAt: new Date(),
          items: {
            create: [{
              id: randomUUID(),
              name: 'Test Product',
              price: 100,
              quantity: 1,
              subtotal: 100,
              category: 'Test',
              material: 'PLA',
            }],
          },
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: freshOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.factura).toBeDefined();

      // Fórmula: Total = (Subtotal - Discount) × 1.21 + Shipping
      const subtotal = Number(body.factura.subtotal);
      const shipping = Number(body.factura.shipping);
      const vatAmount = Number(body.factura.vatAmount);
      const total = Number(body.factura.total);
      
      // Verificar que el IVA es solo sobre productos
      expect(vatAmount).toBeCloseTo(subtotal * 0.21, 2);
      
      // Verificar el total
      const expectedTotal = subtotal * 1.21 + shipping;
      expect(total).toBeCloseTo(expectedTotal, 2);
    });

    it('should include order details in invoice', async () => {
      // Create fresh order for this test
      const freshOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: `P-DETAIL-${Date.now().toString().slice(-8)}`,
          userId: customerUser.id,
          status: 'DELIVERED',
          subtotal: 50,
          shipping: 0,
          total: 60.50,
          shippingName: 'Test User',
          shippingPhone: '+34 600 123 456',
          shippingAddress: 'Calle Test 123',
          shippingPostalCode: '28001',
          shippingCity: 'Madrid',
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          updatedAt: new Date(),
          items: {
            create: [{
              id: randomUUID(),
              name: 'Test Product',
              price: 50,
              quantity: 1,
              subtotal: 50,
              category: 'Test',
              material: 'PLA',
            }],
          },
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: freshOrder.id }),
      });

      const res = await createInvoice(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.factura).toBeDefined();
      expect(body.factura.order).toBeDefined();
      expect(body.factura.order.orderNumber).toBe(freshOrder.orderNumber);
    });
  });
});
