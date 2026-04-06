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
        email: `invoice-test-admin-${Date.now()}@test.com`,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Create customer user
    const customerPassword = await bcrypt.hash('CustomerPass123!', 10);
    customerUser = await prisma.user.create({
      data: {
        email: `invoice-test-customer-${Date.now()}@test.com`,
        password: customerPassword,
        name: 'Customer User',
        role: 'CUSTOMER',
        isActive: true,
        taxId: '12345678A',
      },
    });

    // Create delivered order
    const timestamp = Date.now().toString().slice(-6);
    testOrder = await prisma.order.create({
      data: {
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
        items: {
          create: [
            {
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
      
      // Verify VAT calculation (21%)
      const taxableAmount = Number(body.factura.taxableAmount);
      const vatAmount = Number(body.factura.vatAmount);
      const expectedVat = (taxableAmount * 21) / 100;
      expect(vatAmount).toBeCloseTo(expectedVat, 2);
    });

    it('should reject duplicate invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      // Create a fresh order for this test to avoid cleanup issues
      const freshOrder = await prisma.order.create({
        data: {
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
      expect(body.error).toContain('Already exists');
    });

    it('should reject invoice for non-delivered order', async () => {
      // Create pending order
      const pendingOrder = await prisma.order.create({
        data: {
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

    beforeEach(async () => {
      // Create an invoice
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: adminUser.email, name: adminUser.name },
      });

      const res = await createInvoice(new NextRequest('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: testOrder.id }),
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

      const taxableAmount = Number(body.factura.subtotal) + Number(body.factura.shipping);
      expect(body.factura.taxableAmount).toBeCloseTo(taxableAmount, 2);
      
      // Total = taxable + VAT
      const expectedTotal = taxableAmount + Number(body.factura.vatAmount);
      expect(body.factura.total).toBeCloseTo(expectedTotal, 2);
    });

    it('should include order details in invoice', async () => {
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

      expect(body.factura.order).toBeDefined();
      expect(body.factura.order.orderNumber).toBe(testOrder.orderNumber);
    });
  });
});
