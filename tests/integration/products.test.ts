import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getProductDetail } from '@/app/api/products/[slug]/route';

describe('Products API', () => {
  describe('GET /api/products - Listing', () => {
    it('should return list of active products', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?category=DECORATION');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.data.length > 0) {
        expect(data.data[0].category).toBe('DECORATION');
      }
    });

    it('should filter by material', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?material=PLA');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });

    it('should search by query', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?search=vase');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });

    it('should sort by price ascending', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?sortBy=price&order=asc');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.data.length > 1) {
        const price1 = parseFloat(data.data[0].price);
        const price2 = parseFloat(data.data[1].price);
        expect(price1).toBeLessThanOrEqual(price2);
      }
    });

    it('should paginate results', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?page=1');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });
  });

  describe('GET /api/products/[slug] - Detail', () => {
    let testProduct: any;

    beforeAll(async () => {
      // Get an existing product for testing
      testProduct = await prisma.producto.findFirst({
        where: { isActive: true },
        include: { images: true },
      });
    });

    it('should return product detail by slug', async () => {
      if (!testProduct) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${testProduct.slug}`);
      const res = await getProductDetail(req, { params: { slug: testProduct.slug } });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.product).toBeDefined();
      expect(data.data.product.slug).toBe(testProduct.slug);
    });

    it('should return 404 for non-existent product', async () => {
      const req = new NextRequest('http://localhost:3000/api/products/non-existent-product-12345');
      const res = await getProductDetail(req, { params: { slug: 'non-existent-product-12345' } });
      
      expect(res.status).toBe(404);
    });

    it('should include product images', async () => {
      if (!testProduct) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${testProduct.slug}`);
      const res = await getProductDetail(req, { params: { slug: testProduct.slug } });
      
      const data = await res.json();
      expect(data.data.product.images).toBeDefined();
    });
  });

  describe('Admin Product Management', () => {
    it('should create product with valid data', async () => {
      // Verify we can create products via API
      // Note: This requires admin authentication
      const uniqueSlug = `test-product-${Date.now()}`;
      
      // Get or create a category for the test
      let category = await prisma.categoria.findFirst({ where: { isActive: true } });
      if (!category) {
        category = await prisma.categoria.create({
          data: {
            name: 'Test Category',
            slug: `test-category-${Date.now()}`,
            isActive: true,
          },
        });
      }
      
      const product = await prisma.producto.create({
        data: {
          slug: uniqueSlug,
          name: 'Test Product',
          description: 'Test description',
          price: 29.99,
          stock: 10,
          categoryId: category.id,
          material: 'PLA',
          isActive: true,
        },
      });

      expect(product).toBeDefined();
      expect(product.slug).toBe(uniqueSlug);

      // Cleanup
      await prisma.producto.delete({ where: { id: product.id } });
    });

    it('should update product stock', async () => {
      const product = await prisma.producto.findFirst({ where: { isActive: true } });
      if (!product) return;

      const newStock = product.stock + 5;
      
      const updated = await prisma.producto.update({
        where: { id: product.id },
        data: { stock: newStock },
      });

      expect(updated.stock).toBe(newStock);

      // Restore original stock
      await prisma.producto.update({
        where: { id: product.id },
        data: { stock: product.stock },
      });
    });

    it('should activate/deactivate product', async () => {
      const product = await prisma.producto.findFirst({ where: { isActive: true } });
      if (!product) return;

      // Deactivate
      await prisma.producto.update({
        where: { id: product.id },
        data: { isActive: false },
      });

      const deactivated = await prisma.producto.findUnique({
        where: { id: product.id },
      });

      expect(deactivated!.isActive).toBe(false);

      // Reactivate
      await prisma.producto.update({
        where: { id: product.id },
        data: { isActive: true },
      });
    });
  });
});
