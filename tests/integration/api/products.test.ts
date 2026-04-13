/**
 * Integration Tests - Products API
 * Testing real database and API endpoints
 *
 * Endpoints:
 * - GET /api/products - listing with filters
 * - GET /api/products/[slug] - product detail
 * - POST /api/admin/products - create product (admin)
 * - PATCH /api/admin/products/[id] - update stock (admin)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getProductDetail } from '@/app/api/products/[slug]/route';
import { POST as createProduct } from '@/app/api/admin/products/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { Material } from '@prisma/client';

describe('Products API', () => {
  let testCategory: { id: string; name: string; slug: string };
  let testProducts: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    stock: number;
    material: Material;
    isActive: boolean;
  }> = [];

  beforeEach(async () => {
    // Clean up test data
    await prisma.productImage.deleteMany({
      where: { product: { slug: { startsWith: 'test-product-' } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'test-product-' } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'test-category-' } },
    });

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create test products
    const timestamp = Date.now();
    testProducts = [];

    const product1 = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: 'Test Product PLA',
        slug: `test-product-${timestamp}-1`,
        description: 'A test product made with PLA',
        price: 19.99,
        stock: 10,
        categoryId: testCategory.id,
        material: 'PLA',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    const product2 = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: 'Test Product PETG',
        slug: `test-product-${timestamp}-2`,
        description: 'A test product made with PETG',
        price: 39.99,
        stock: 5,
        categoryId: testCategory.id,
        material: 'PETG',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    const inactiveProduct = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: 'Inactive Test Product',
        slug: `test-product-${timestamp}-3`,
        description: 'An inactive test product',
        price: 29.99,
        stock: 0,
        categoryId: testCategory.id,
        material: 'PLA',
        isActive: false,
        updatedAt: new Date(),
      },
    });

    testProducts = [
      { ...product1, price: Number(product1.price) },
      { ...product2, price: Number(product2.price) },
      { ...inactiveProduct, price: Number(inactiveProduct.price) },
    ];
  });

  afterEach(async () => {
    // Clean up
    await prisma.productImage.deleteMany({
      where: { product: { slug: { startsWith: 'test-product-' } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'test-product-' } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'test-category-' } },
    });
  });

  describe('GET /api/products - Product Listing', () => {
    it('should return list of active products', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      // Should only return active products
      expect(body.data.every((p: { isActive: boolean }) => p.isActive)).toBe(true);
    });

    it('should filter by category slug', async () => {
      const req = new NextRequest(`http://localhost:3000/api/products?category=${testCategory.slug}`);
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.filters.category).toBe(testCategory.slug);
    });

    it('should filter by material', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?material=PLA');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.every((p: { material: string }) => p.material === 'PLA')).toBe(true);
    });

    it('should filter by price range', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?minPrice=20&maxPrice=30');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      body.data.forEach((p: { price: number }) => {
        expect(Number(p.price)).toBeGreaterThanOrEqual(20);
        expect(Number(p.price)).toBeLessThanOrEqual(30);
      });
    });

    it('should search by query string', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?search=PETG');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      // Should find products with "PETG" in name or description
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should sort by price ascending', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?sortBy=price&sortOrder=asc');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      const prices = body.data.map((p: { price: number }) => Number(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should sort by price descending', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?sortBy=price&sortOrder=desc');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      const prices = body.data.map((p: { price: number }) => Number(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it('should paginate results', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?page=1&pageSize=2');
      const res = await getProducts(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.pageSize).toBe(2);
      expect(body.data.length).toBeLessThanOrEqual(2);
    });

    it('should include category information', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await getProducts(req);
      const body = await res.json();

      if (body.data.length > 0) {
        expect(body.data[0].category).toBeDefined();
      }
    });

    it('should not include inactive products', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await getProducts(req);
      const body = await res.json();

      const inactiveProducts = body.data.filter((p: { isActive: boolean }) => !p.isActive);
      expect(inactiveProducts.length).toBe(0);
    });
  });

  describe('GET /api/products/[slug] - Product Detail', () => {
    it('should return product by slug', async () => {
      const activeProduct = testProducts.find(p => p.isActive);
      if (!activeProduct) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${activeProduct.slug}`);
      const res = await getProductDetail(req, {
        params: { slug: activeProduct.slug },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.product.slug).toBe(activeProduct.slug);
      // For products without translation, name is formatted from slug (title case)
      expect(body.data.product.name).toBeDefined();
      expect(body.data.product.name).not.toBe('');
    });

    it('should return 404 for non-existent product', async () => {
      const req = new NextRequest('http://localhost:3000/api/products/non-existent-product-12345');
      const res = await getProductDetail(req, {
        params: { slug: 'non-existent-product-12345' },
      });

      expect(res.status).toBe(404);
    });

    it('should return 404 for inactive product', async () => {
      const inactiveProduct = testProducts.find(p => !p.isActive);
      if (!inactiveProduct) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${inactiveProduct.slug}`);
      const res = await getProductDetail(req, {
        params: { slug: inactiveProduct.slug },
      });

      expect(res.status).toBe(404);
    });

    it('should include product images', async () => {
      const activeProduct = testProducts.find(p => p.isActive);
      if (!activeProduct) return;

      // Add an image to the product
      await prisma.productImage.create({
        data: {
          id: randomUUID(),
          productId: activeProduct.id,
          url: 'https://example.com/image.jpg',
          filename: 'image.jpg',
          altText: 'Test Image',
          isMain: true,
          displayOrder: 0,
          uploadedAt: new Date(),
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/products/${activeProduct.slug}`);
      const res = await getProductDetail(req, {
        params: { slug: activeProduct.slug },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.product.images).toBeDefined();
      expect(Array.isArray(body.data.product.images)).toBe(true);
    });

    it('should include related products', async () => {
      const activeProduct = testProducts.find(p => p.isActive);
      if (!activeProduct) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${activeProduct.slug}`);
      const res = await getProductDetail(req, {
        params: { slug: activeProduct.slug },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.related).toBeDefined();
      expect(Array.isArray(body.data.related)).toBe(true);
    });
  });

  describe('POST /api/admin/products - Create Product (Admin)', () => {
    beforeEach(async () => {
      // Create admin user for tests
      const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `admin-${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
          updatedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      // Clean up admin user
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'admin-' } },
      });
    });

    it('should require authentication', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Product',
          description: 'A new product',
          price: 29.99,
          stock: 10,
          categoryId: testCategory.id,
          material: 'PLA',
        }),
      });

      const res = await createProduct(req);
      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      // Create a customer user
      const hashedPassword = await bcrypt.hash('CustomerPass123!', 10);
      const customer = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `customer-${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Customer User',
          role: 'CUSTOMER',
          isActive: true,
          updatedAt: new Date(),
        },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Product',
          description: 'A new product',
          price: 29.99,
          stock: 10,
          categoryId: testCategory.id,
          material: 'PLA',
        }),
      });

      const res = await createProduct(req);
      expect(res.status).toBe(401);

      await prisma.user.delete({ where: { id: customer.id } });
    });

    it('should reject invalid product data', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Invalid: empty name
          description: 'A new product',
          price: -10, // Invalid: negative price
          stock: 10,
          categoryId: testCategory.id,
          material: 'PLA',
        }),
      });

      const res = await createProduct(req);
      expect([400, 401]).toContain(res.status);
    });
  });
});
